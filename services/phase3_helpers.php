<?php
/** Shared request helpers for Phase 3 account endpoints. */

function phase3_require_method(array $allowed): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $allowed = array_map('strtoupper', $allowed);
    if (!in_array($method, $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        http_response_code(405);
        echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
        exit;
    }
}

function phase3_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Request body must be valid JSON']);
        exit;
    }
    return $data;
}

function phase3_respond(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function phase3_active_user(PDO $pdo, int $userId, string $fields = 'id, email, name, role, bio, avatar_url, account_status, created_at'): ?array
{
    try {
        $stmt = $pdo->prepare("SELECT {$fields} FROM users WHERE id = ? AND (account_status = 'active' OR account_status IS NULL) LIMIT 1");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        return $user ?: null;
    } catch (Throwable $e) {
        // Fallback jika kolom account_status atau fields opsional belum ada di DB
        try {
            $stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            if ($user) {
                $user['account_status'] = 'active';
            }
            return $user ?: null;
        } catch (Throwable $e2) {
            return null;
        }
    }
}

function phase3_public_user(array $user): array
{
    unset($user['password_hash']);
    return $user;
}