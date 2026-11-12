<?php

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
    $abstract = submission_required_string($data, 'abstract', 20000);
    $volume = submission_required_string($data, 'volume', 100);
    $authors = submission_json_list($data, 'authors', true);
    $tags = submission_json_list($data, 'tags');
    $pengurus = submission_json_list($data, 'pengurus');
    $email = submission_required_string($data, 'email', 255);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Format email tidak valid.');
    }
    $contact = submission_required_string($data, 'contact', 100);
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
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'user_id'");
        $hasUserId = (bool)$c->fetch();
    } catch (Throwable $e) {}
    try {
        $c = $pdo->query("SHOW COLUMNS FROM journals LIKE 'status'");
        $hasStatus = (bool)$c->fetch();
    } catch (Throwable $e) {}

    if ($hasUserId && $hasStatus) {
        $stmt = $pdo->prepare(
            "INSERT INTO journals
               (user_id, status, title, abstract, file_upload_id, cover_upload_id,
                authors, tags, pengurus, email, contact, volume, rejection_reason,
                reviewed_by, reviewed_at)
             VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)"
        );
        $stmt->execute([
            $userId, $title, $abstract, $fileUploadId, $coverUploadId,
            $authors, $tags, $pengurus, $email, $contact, $volume,
        ]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO journals
               (title, abstract, file_upload_id, cover_upload_id,
                authors, tags, pengurus, email, contact, volume)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $title, $abstract, $fileUploadId, $coverUploadId,
            $authors, $tags, $pengurus, $email, $contact, $volume,
        ]);
    }
    $journalId = (int)$pdo->lastInsertId();

    $token = token_debit_upload(
        $pdo,
        $userId,
        'journal_submission',
        $journalId,
        1,
        'Journal submission #' . $journalId
    );
    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        'ok' => true,
        'message' => 'Jurnal berhasil dikirim dan menunggu review admin.',
        'submission' => ['id' => $journalId, 'type' => 'jurnal', 'status' => 'pending'],
        'token' => $token,
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    submission_error($e);
}