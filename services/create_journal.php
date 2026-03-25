<?php
// ===== CREATE JOURNAL - WITH DATETIME CONVERSION =====
require_once __DIR__ . '/db.php';

error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || empty($data['title'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Invalid payload: title is required']);
        exit;
    }

    // Extract data
    $title = trim($data['title']);
    $abstract = $data['abstract'] ?? null;
    $fileUrl = $data['fileUrl'] ?? null;
    $coverUrl = $data['coverUrl'] ?? null;
    $email = $data['email'] ?? null;
    $contact = $data['contact'] ?? null;

    $authors = isset($data['authors']) && is_array($data['authors'])
        ? json_encode($data['authors'])
        : null;

    $tags = isset($data['tags']) && is_array($data['tags'])
        ? json_encode($data['tags'])
        : null;

    $pengurus = isset($data['pengurus']) && is_array($data['pengurus'])
        ? json_encode($data['pengurus'])
        : null;

    $volume = $data['volume'] ?? null;  // TAMBAH INI

    $client_temp_id = $data['client_temp_id'] ?? null;

    // ===== FIX: Convert ISO 8601 to MySQL DATETIME =====
    $client_updated_at = null;
    if (isset($data['client_updated_at'])) {
        try {
            $dt = new DateTime($data['client_updated_at']);
            $client_updated_at = $dt->format('Y-m-d H:i:s');
        } catch (Exception $e) {
            error_log("DateTime conversion error: " . $e->getMessage());
            $client_updated_at = date('Y-m-d H:i:s');
        }
    }

    // Helper function to find upload ID
    function find_upload_id($pdo, $url)
    {
        if (!$url) return null;

        try {
            $stmt = $pdo->prepare("SELECT id FROM uploads WHERE url = ? LIMIT 1");
            $stmt->execute([$url]);
            $r = $stmt->fetch();
            return $r ? (int)$r['id'] : null;
        } catch (Exception $e) {
            error_log("find_upload_id error: " . $e->getMessage());
            return null;
        }
    }

    $file_upload_id = find_upload_id($pdo, $fileUrl);
    $cover_upload_id = find_upload_id($pdo, $coverUrl);

    if (!$file_upload_id) {
        http_response_code(400);
        echo json_encode([
            'ok' => false,
            'message' => 'File upload not found in database',
            'debug' => ['fileUrl' => $fileUrl]
        ]);
        exit;
    }

    // Prepare SQL statement
    $stmt = $pdo->prepare("
        INSERT INTO journals (
            title, 
            abstract, 
            file_upload_id, 
            cover_upload_id, 
            authors, 
            tags, 
            pengurus,
            volume,
            email, 
            contact, 
            client_temp_id, 
            client_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    // Execute insert
    $result = $stmt->execute([
        $title,
        $abstract,
        $file_upload_id,
        $cover_upload_id,
        $authors,
        $tags,
        $pengurus,
        $volume,
        $email,
        $contact,
        $client_temp_id,
        $client_updated_at
    ]);

    if (!$result) {
        throw new Exception("Failed to insert journal into database");
    }

    $id = $pdo->lastInsertId();

    echo json_encode([
        'ok' => true,
        'id' => (int)$id,
        'message' => 'Journal created successfully',
        'mapped' => [
            'client_temp_id' => $client_temp_id,
            'server_id' => (int)$id
        ]
    ]);
} catch (PDOException $e) {
    error_log("Database error in create_journal.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
} catch (Exception $e) {
    error_log("Error in create_journal.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
