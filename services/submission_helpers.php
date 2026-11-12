<?php

/**
 * Shared helpers for Phase 2 journal submission endpoints.
 */

function submission_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Payload JSON tidak valid.');
    }

    return $data;
}

function submission_positive_int($value, string $field): int
{
    if (filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) === false) {
        throw new InvalidArgumentException("{$field} harus berupa ID yang valid.");
    }

    return (int)$value;
}

function submission_required_string(array $data, string $field, int $maxLength): string
{
    $value = trim((string)($data[$field] ?? ''));
    if ($value === '') {
        throw new InvalidArgumentException("{$field} wajib diisi.");
    }

    if (mb_strlen($value) > $maxLength) {
        throw new InvalidArgumentException("{$field} terlalu panjang.");
    }

    return $value;
}

function submission_optional_string(array $data, string $field, int $maxLength): ?string
{
    if (!array_key_exists($field, $data) || $data[$field] === null) {
        return null;
    }

    $value = trim((string)$data[$field]);
    if (mb_strlen($value) > $maxLength) {
        throw new InvalidArgumentException("{$field} terlalu panjang.");
    }

    return $value === '' ? null : $value;
}

function submission_json_list(array $data, string $field, bool $required = false): ?string
{
    if (!array_key_exists($field, $data) || $data[$field] === null) {
        if ($required) {
            throw new InvalidArgumentException("{$field} wajib diisi.");
        }
        return null;
    }

    if (!is_array($data[$field])) {
        throw new InvalidArgumentException("{$field} harus berupa array.");
    }

    $items = [];
    foreach ($data[$field] as $item) {
        $item = trim((string)$item);
        if ($item === '') continue;
        if (mb_strlen($item) > 255) {
            throw new InvalidArgumentException("Item {$field} terlalu panjang.");
        }
        $items[] = $item;
    }

    if ($required && count($items) === 0) {
        throw new InvalidArgumentException("{$field} minimal berisi satu item.");
    }

    return json_encode(array_values($items), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function submission_assert_upload(PDO $pdo, int $uploadId, int $userId, string $kind): array
{
    $hasUserId = false;
    try {
        $c = $pdo->query("SHOW COLUMNS FROM uploads LIKE 'user_id'");
        $hasUserId = (bool)$c->fetch();
    } catch (Throwable $e) {}

    $selectCols = $hasUserId ? 'id, user_id, mime, url' : 'id, mime, url';
    $stmt = $pdo->prepare(
        "SELECT {$selectCols} FROM uploads WHERE id = ? LIMIT 1 FOR UPDATE"
    );
    $stmt->execute([$uploadId]);
    $upload = $stmt->fetch();

    if (!$upload) {
        throw new DomainException("Upload {$kind} tidak ditemukan.");
    }

    if ($hasUserId && isset($upload['user_id']) && $upload['user_id'] !== null && (int)$upload['user_id'] !== $userId) {
        throw new DomainException("Upload {$kind} bukan milik Anda.");
    }

    $mime = strtolower((string)($upload['mime'] ?? ''));
    if ($kind === 'PDF' && $mime !== 'application/pdf') {
        throw new DomainException('file_upload_id harus menunjuk file PDF.');
    }
    if ($kind === 'cover' && strpos($mime, 'image/') !== 0) {
        throw new DomainException('cover_upload_id harus menunjuk file gambar.');
    }

    return $upload;
}

function submission_decode_lists(array $row): array
{
    foreach (['authors', 'tags', 'pengurus'] as $field) {
        if (array_key_exists($field, $row)) {
            $decoded = json_decode((string)$row[$field], true);
            $row[$field] = is_array($decoded) ? $decoded : [];
        }
    }

    return $row;
}

function submission_error(Throwable $e): void
{
    if ($e instanceof InvalidArgumentException) {
        http_response_code(400);
        $code = 'VALIDATION_ERROR';
    } elseif ($e instanceof DomainException) {
        http_response_code(422);
        $code = 'SUBMISSION_ERROR';
    } elseif ($e instanceof RuntimeException && $e->getCode() === 402) {
        http_response_code(402);
        $code = 'INSUFFICIENT_TOKEN';
    } else {
        error_log('Submission endpoint error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Terjadi kesalahan pada server.', 'code' => 'SERVER_ERROR']);
        return;
    }

    echo json_encode(['ok' => false, 'message' => $e->getMessage(), 'code' => $code]);
}