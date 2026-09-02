<?php

/**
 * Recent-activity feed for the user dashboard.
 *
 * Single source of truth = database. The dashboard used to build this feed
 * purely client-side (localStorage + in-memory article list), which made the
 * card look populated on a machine that had stale local state and empty on a
 * fresh browser/production. Everything below is derived from committed rows so
 * local and production behave identically.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';

$user = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Only GET allowed']);
    exit;
}

const USER_ACTIVITY_MAX_LIMIT = 30;

/**
 * Token ledger movements (purchase credits, upload debits, adjustments).
 */
function user_activity_token_events(PDO $pdo, int $userId, int $limit): array
{
    $stmt = $pdo->prepare(
        "SELECT type, amount, balance_after, description, created_at
         FROM token_transactions
         WHERE user_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT {$limit}"
    );
    $stmt->execute([$userId]);

    $events = [];
    foreach ($stmt->fetchAll() as $row) {
        $amount = (int)$row['amount'];
        $type = (string)$row['type'];

        if ($type === 'purchase' || $amount > 0) {
            $events[] = [
                'kind' => 'token_credit',
                'icon' => 'plus-circle',
                'colorClass' => 'activity-icon--navy',
                'text' => 'Token bertambah +' . abs($amount),
                'time' => $row['created_at'],
            ];
            continue;
        }

        $events[] = [
            'kind' => 'token_debit',
            'icon' => 'minus-circle',
            'colorClass' => 'activity-icon--navy',
            'text' => 'Token digunakan ' . $amount . ' (' . ($row['description'] ?: 'unggahan konten') . ')',
            'time' => $row['created_at'],
        ];
    }

    return $events;
}

/**
 * Purchase requests that have not produced a ledger row yet (or were rejected).
 */
function user_activity_purchase_events(PDO $pdo, int $userId, int $limit): array
{
    $stmt = $pdo->prepare(
        "SELECT public_id, amount, status, created_at, submitted_at, rejected_at
         FROM token_purchase_requests
         WHERE user_id = ? AND status <> 'approved'
         ORDER BY created_at DESC, id DESC
         LIMIT {$limit}"
    );
    $stmt->execute([$userId]);

    $events = [];
    foreach ($stmt->fetchAll() as $row) {
        $amount = (int)$row['amount'];
        switch ($row['status']) {
            case 'rejected':
                $events[] = [
                    'kind' => 'purchase_rejected',
                    'icon' => 'x-circle',
                    'colorClass' => 'activity-icon--navy',
                    'text' => 'Pembelian ' . $amount . ' token ditolak (' . $row['public_id'] . ')',
                    'time' => $row['rejected_at'] ?: $row['created_at'],
                ];
                break;
            case 'cancelled':
                $events[] = [
                    'kind' => 'purchase_cancelled',
                    'icon' => 'slash',
                    'colorClass' => 'activity-icon--navy',
                    'text' => 'Pembelian ' . $amount . ' token dibatalkan (' . $row['public_id'] . ')',
                    'time' => $row['created_at'],
                ];
                break;
            default: // awaiting_proof | pending
                $events[] = [
                    'kind' => 'purchase_pending',
                    'icon' => 'clock',
                    'colorClass' => 'activity-icon--navy',
                    'text' => 'Pembelian ' . $amount . ' token menunggu persetujuan admin',
                    'time' => $row['submitted_at'] ?: $row['created_at'],
                ];
                break;
        }
    }

    return $events;
}

/**
 * Journal / opinion review milestones.
 */
function user_activity_content_events(PDO $pdo, int $userId, int $limit): array
{
    $sql = "SELECT 'journal' AS content_type, title, status, created_at, reviewed_at
            FROM journals
            WHERE user_id = ?
            UNION ALL
            SELECT 'opinion' AS content_type, title, status, created_at, reviewed_at
            FROM opinions
            WHERE user_id = ?
            ORDER BY COALESCE(reviewed_at, created_at) DESC
            LIMIT {$limit}";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $userId]);

    $label = ['journal' => 'Jurnal', 'opinion' => 'Opini'];
    $events = [];

    foreach ($stmt->fetchAll() as $row) {
        $name = $label[$row['content_type']] ?? 'Konten';
        $title = (string)$row['title'];

        switch ($row['status']) {
            case 'published':
                $events[] = [
                    'kind' => 'content_published',
                    'icon' => 'check',
                    'colorClass' => 'activity-icon--navy',
                    'text' => $name . ' "' . $title . '" dipublikasikan',
                    'time' => $row['reviewed_at'] ?: $row['created_at'],
                ];
                break;
            case 'rejected':
                $events[] = [
                    'kind' => 'content_rejected',
                    'icon' => 'x-circle',
                    'colorClass' => 'activity-icon--navy',
                    'text' => $name . ' "' . $title . '" ditolak reviewer',
                    'time' => $row['reviewed_at'] ?: $row['created_at'],
                ];
                break;
            case 'pending':
                $events[] = [
                    'kind' => 'content_pending',
                    'icon' => 'upload-cloud',
                    'colorClass' => 'activity-icon--navy',
                    'text' => $name . ' "' . $title . '" sedang direview',
                    'time' => $row['created_at'],
                ];
                break;
            default: // draft
                break;
        }
    }

    return $events;
}

try {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 8;
    $limit = max(1, min(USER_ACTIVITY_MAX_LIMIT, $limit));
    $userId = (int)$user['id'];

    // Fetch a slightly wider window per source, then merge and trim.
    $pool = USER_ACTIVITY_MAX_LIMIT;
    $events = array_merge(
        user_activity_token_events($pdo, $userId, $pool),
        user_activity_purchase_events($pdo, $userId, $pool),
        user_activity_content_events($pdo, $userId, $pool)
    );

    usort($events, static function (array $a, array $b): int {
        return strtotime((string)$b['time']) <=> strtotime((string)$a['time']);
    });

    echo json_encode([
        'ok' => true,
        'activities' => array_slice($events, 0, $limit),
    ]);
} catch (Throwable $e) {
    error_log(sprintf(
        "[user_activity] %s: %s at %s:%d\n%s",
        get_class($e),
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
        $e->getTraceAsString()
    ));
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Aktivitas belum dapat dimuat.']);
}
