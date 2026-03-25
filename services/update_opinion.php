<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Only POST method allowed']);
    exit;
}

try {
    // Support both JSON and FormData
    $isJson = isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false;

    if ($isJson) {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? 0;
    } else {
        $id = $_POST['id'] ?? 0;
    }

    if (!$id) {
        throw new Exception('Opinion ID is required');
    }

    error_log("=== UPDATE OPINION API ===");
    error_log("Opinion ID: $id");

    $stmt = $pdo->prepare("SELECT * FROM opinions WHERE id = ?");
    $stmt->execute([$id]);
    $opinion = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$opinion) {
        throw new Exception('Opinion not found');
    }

    // Get data from JSON or POST
    if ($isJson) {
        $title = $data['title'] ?? $opinion['title'];
        $description = $data['description'] ?? $opinion['description'];
        $author_name = $data['author_name'] ?? $opinion['author_name'];
        $email = $data['email'] ?? $opinion['email'];
        $contact = $data['contact'] ?? $opinion['contact'];
        $category = $data['category'] ?? $opinion['category'];
    } else {
        $title = $_POST['title'] ?? $opinion['title'];
        $description = $_POST['description'] ?? $opinion['description'];
        $email = $_POST['email'] ?? $opinion['email'];
        $contact = $_POST['contact'] ?? $_POST['contact'] ?? $opinion['contact'];
        $category = $_POST['category'] ?? $opinion['category'];

        // Handle authors array appropriately
        if (isset($_POST['authors'])) {
            $authorsInput = $_POST['authors'];
            if (is_string($authorsInput)) {
                $decoded = json_decode($authorsInput, true);
                if (is_array($decoded)) {
                    $authorsInput = $decoded;
                }
            }
            if (is_array($authorsInput) && count($authorsInput) > 0) {
                $author_name = json_encode($authorsInput);
            } else {
                $author_name = $_POST['author_name'] ?? $opinion['author_name'];
            }
        } else {
            $author_name = $_POST['author_name'] ?? $opinion['author_name'];
        }

        // Handle tags exactly the same way if the column exists in db. Right now let's just parse it if it does
        $tags = $_POST['tags'] ?? $opinion['tags'] ?? null;
    }

    $fileUploadId = $opinion['file_upload_id'];
    $coverUploadId = $opinion['cover_upload_id'];

    $uploadDir = UPLOAD_DIR_ABS;
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    // Handle file upload (only from FormData)
    if (!$isJson && isset($_FILES['file_pdf']) && $_FILES['file_pdf']['error'] === UPLOAD_ERR_OK) {
        $pdfFile = $_FILES['file_pdf'];

        if ($pdfFile['size'] > 20 * 1024 * 1024) {
            throw new Exception('Ukuran file PDF maksimal 20MB');
        }

        $pdfExt = pathinfo($pdfFile['name'], PATHINFO_EXTENSION);
        $pdfSafeName = bin2hex(random_bytes(12)) . '.' . $pdfExt;
        $pdfTarget = $uploadDir . '/' . $pdfSafeName;

        if (move_uploaded_file($pdfFile['tmp_name'], $pdfTarget)) {
            $pdfPublicUrl = APP_ROOT . '/uploads/' . $pdfSafeName;
            $pdfMime = $pdfFile['type'] ?? mime_content_type($pdfTarget);
            $pdfSize = (int)$pdfFile['size'];

            $stmt = $pdo->prepare("INSERT INTO uploads (filename, original_name, mime, size, url) VALUES (?,?,?,?,?)");
            $stmt->execute([$pdfSafeName, $pdfFile['name'], $pdfMime, $pdfSize, $pdfPublicUrl]);
            $newFileUploadId = $pdo->lastInsertId();

            if ($fileUploadId) {
                $stmt = $pdo->prepare("SELECT filename FROM uploads WHERE id = ?");
                $stmt->execute([$fileUploadId]);
                $oldFile = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($oldFile) {
                    $oldPath = $uploadDir . '/' . $oldFile['filename'];
                    if (file_exists($oldPath)) unlink($oldPath);
                }
                $pdo->prepare("DELETE FROM uploads WHERE id = ?")->execute([$fileUploadId]);
            }

            $fileUploadId = $newFileUploadId;
            error_log("New PDF uploaded: $pdfPublicUrl");
        }
    }

    // Handle cover upload (only from FormData)
    if (!$isJson && isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
        $coverFile = $_FILES['cover_image'];

        if ($coverFile['size'] <= 5 * 1024 * 1024) {
            $coverExt = pathinfo($coverFile['name'], PATHINFO_EXTENSION);
            $coverSafeName = bin2hex(random_bytes(12)) . '.' . $coverExt;
            $coverTarget = $uploadDir . '/' . $coverSafeName;

            if (move_uploaded_file($coverFile['tmp_name'], $coverTarget)) {
                $coverPublicUrl = APP_ROOT . '/uploads/' . $coverSafeName;
                $coverMime = $coverFile['type'] ?? mime_content_type($coverTarget);
                $coverSize = (int)$coverFile['size'];

                $stmt = $pdo->prepare("INSERT INTO uploads (filename, original_name, mime, size, url) VALUES (?,?,?,?,?)");
                $stmt->execute([$coverSafeName, $coverFile['name'], $coverMime, $coverSize, $coverPublicUrl]);
                $newCoverUploadId = $pdo->lastInsertId();

                if ($coverUploadId) {
                    $stmt = $pdo->prepare("SELECT filename FROM uploads WHERE id = ?");
                    $stmt->execute([$coverUploadId]);
                    $oldCover = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($oldCover) {
                        $oldPath = $uploadDir . '/' . $oldCover['filename'];
                        if (file_exists($oldPath)) unlink($oldPath);
                    }
                    $pdo->prepare("DELETE FROM uploads WHERE id = ?")->execute([$coverUploadId]);
                }

                $coverUploadId = $newCoverUploadId;
                error_log("New cover uploaded: $coverPublicUrl");
            }
        }
    }

    $stmt = $pdo->prepare("
        UPDATE opinions 
        SET title = ?, description = ?, author_name = ?, email = ?, contact = ?, 
            category = ?, tags = ?, file_upload_id = ?, cover_upload_id = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $title,
        $description,
        $author_name,
        $email,
        $contact,
        $category,
        $tags,
        $fileUploadId,
        $coverUploadId,
        $id
    ]);

    error_log("Opinion updated successfully: $id");

    echo json_encode([
        'ok' => true,
        'message' => 'Opini berhasil diupdate'
    ]);
} catch (Exception $e) {
    error_log('Update opinion error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage()
    ]);
}
