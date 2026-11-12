<?php

/**
 * User-facing opinion submission endpoint.
 *
 * Mirrors submit_journal.php: JWT user auth (not admin), upload-id based
 * payload, ownership validation on the uploads, and an atomic token debit.
 * services/create_opinion.php stays admin-only for direct publishing.
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';
require_once __DIR__ . '/token_service.php';
require_once __DIR__ . '/submission_helpers.php';

$auth_user = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

try {
    $data = submission_json_body();
    $userId = (int)$auth_user['id'];
    $title = submission_required_string($data, 'title', 512);
    $description = submission_required_string($data, 'description', 20000);
    $category = submission_optional_string($data, 'category', 50) ?? 'opini';
    $authors = submission_json_list($data, 'authors', true);
    $tags = submission_json_list($data, 'tags');
    $email = submission_required_string($data, 'email', 255);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Format email tidak valid.');
    }
    $contact = submission_required_string($data, 'contact', 100);

    // author_name keeps the legacy single-author column populated so existing
    // listing/detail queries keep working without a schema change.
    $decodedAuthors = json_decode((string)$authors, true);
    $authorName = is_array($decodedAuthors) && isset($decodedAuthors[0])
        ? mb_substr((string)$decodedAuthors[0], 0, 255)
        : 'Anonymous';

    $fileUploadId = submission_positive_int($data['file_upload_id'] ?? null, 'file_upload_id');
    $coverUploadId = null;
    if (isset($data['cover_upload_id']) && $data['cover_upload_id'] !== '') {
        $coverUploadId = submission_positive_int($data['cover_upload_id'], 'cover_upload_id');
    }

    $pdo->beginTransaction();
    submission_assert_upload($pdo, $fileUploadId, $userId, 'PDF');
    if ($coverUploadId !== null) {
        submission_assert_upload($pdo, $coverUploadId, $userId, 'cover');
    }

    $hasUserId = false;
    $hasStatus = false;
    try {
        $c = $pdo->query("SHOW COLUMNS FROM opinions LIKE 'user_id'");
        $hasUserId = (bool)$c->fetch();
    } catch (Throwable $e) {}
    try {
        $c = $pdo->query("SHOW COLUMNS FROM opinions LIKE 'status'");
        $hasStatus = (bool)$c->fetch();
    } catch (Throwable $e) {}

    if ($hasUserId && $hasStatus) {
        $stmt = $pdo->prepare(
            "INSERT INTO opinions
               (user_id, status, title, description, category, author_name,
                file_upload_id, cover_upload_id, authors, tags, email, contact,
                rejection_reason, reviewed_by, reviewed_at)
             VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)"
        );
        $stmt->execute([
            $userId, $title, $description, $category, $authorName,
            $fileUploadId, $coverUploadId, $authors, $tags, $email, $contact,
        ]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO opinions
               (title, description, category, author_name,
                file_upload_id, cover_upload_id, authors, tags, email, contact)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $title, $description, $category, $authorName,
            $fileUploadId, $coverUploadId, $authors, $tags, $email, $contact,
        ]);
    }
    $opinionId = (int)$pdo->lastInsertId();

    $token = token_debit_upload(
        $pdo,
        $userId,
        'opinion_submission',
        $opinionId,
        1,
        'Opinion submission #' . $opinionId
    );
    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        'ok' => true,
        'message' => 'Opini berhasil dikirim dan menunggu review admin.',
        'submission' => ['id' => $opinionId, 'type' => 'opini', 'status' => 'pending'],
        'token' => $token,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    submission_error($e);
}
