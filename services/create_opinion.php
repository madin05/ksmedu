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

try {
    error_log("=== CREATE OPINION API ===");
    error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));

    $file_upload_id = null;
    $cover_upload_id = null;

    // Detect if this is FormData with files or JSON with URLs
    $isFormData = !empty($_FILES);

    if ($isFormData) {
        // SCENARIO 1: FormData dengan file upload langsung
        error_log("Mode: FormData with file uploads");

        $title = $_POST['title'] ?? '';
        $description = $_POST['description'] ?? '';
        $category = $_POST['category'] ?? 'opini';
        $author_name = $_POST['author_name'] ?? '';
        $email = $_POST['email'] ?? '';
        $contact = $_POST['contact'] ?? '';
        $tags = $_POST['tags'] ?? '[]';

        // Validate required fields
        if (empty($title) || empty($author_name)) {
            throw new Exception('Title and author name are required');
        }

        $uploadDir = __DIR__ . '/../../uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Upload PDF file (required)
        if (isset($_FILES['file_pdf']) && $_FILES['file_pdf']['error'] === UPLOAD_ERR_OK) {
            $pdfFile = $_FILES['file_pdf'];

            if ($pdfFile['size'] > 20 * 1024 * 1024) {
                throw new Exception('Ukuran file PDF maksimal 20MB');
            }

            if ($pdfFile['type'] !== 'application/pdf') {
                throw new Exception('Hanya file PDF yang diperbolehkan');
            }

            $pdfExt = pathinfo($pdfFile['name'], PATHINFO_EXTENSION);
            $pdfSafeName = bin2hex(random_bytes(12)) . ($pdfExt ? '.' . $pdfExt : '.pdf');
            $pdfTarget = $uploadDir . '/' . $pdfSafeName;

            if (!move_uploaded_file($pdfFile['tmp_name'], $pdfTarget)) {
                throw new Exception('Gagal mengupload file PDF');
            }

            $pdfPublicUrl = '/uploads/' . $pdfSafeName;
            $pdfMime = $pdfFile['type'] ?? mime_content_type($pdfTarget);
            $pdfSize = (int)$pdfFile['size'];

            $stmt = $pdo->prepare("INSERT INTO uploads (filename, original_name, mime, size, url) VALUES (?,?,?,?,?)");
            $stmt->execute([$pdfSafeName, $pdfFile['name'], $pdfMime, $pdfSize, $pdfPublicUrl]);
            $file_upload_id = $pdo->lastInsertId();

            error_log("PDF uploaded: $pdfPublicUrl (ID: $file_upload_id)");
        } else {
            throw new Exception('File PDF wajib diupload');
        }

        // Upload cover image (optional)
        if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
            $coverFile = $_FILES['cover_image'];

            if ($coverFile['size'] <= 5 * 1024 * 1024) {
                $coverExt = pathinfo($coverFile['name'], PATHINFO_EXTENSION);
                $coverSafeName = bin2hex(random_bytes(12)) . ($coverExt ? '.' . $coverExt : '.jpg');
                $coverTarget = $uploadDir . '/' . $coverSafeName;

                if (move_uploaded_file($coverFile['tmp_name'], $coverTarget)) {
                    $coverPublicUrl = '/uploads/' . $coverSafeName;
                    $coverMime = $coverFile['type'] ?? mime_content_type($coverTarget);
                    $coverSize = (int)$coverFile['size'];

                    $stmt = $pdo->prepare("INSERT INTO uploads (filename, original_name, mime, size, url) VALUES (?,?,?,?,?)");
                    $stmt->execute([$coverSafeName, $coverFile['name'], $coverMime, $coverSize, $coverPublicUrl]);
                    $cover_upload_id = $pdo->lastInsertId();

                    error_log("Cover uploaded: $coverPublicUrl (ID: $cover_upload_id)");
                }
            } else {
                error_log("Warning: Cover image too large, skipping");
            }
        }
    } else {
        // SCENARIO 2: JSON dengan fileUrl yang sudah diupload sebelumnya
        error_log("Mode: JSON with pre-uploaded file URLs");

        $input = json_decode(file_get_contents('php://input'), true);
        error_log("JSON Input: " . json_encode($input));

        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        $category = $input['category'] ?? 'opini';
        $author_name = $input['authorname'] ?? $input['author_name'] ?? $input['authorName'] ?? '';
        $email = $input['email'] ?? '';
        $contact = $input['contact'] ?? '';
        $tags = $input['tags'] ?? '[]';

        // Validate required fields
        if (empty($title) || empty($author_name)) {
            throw new Exception('Title and author name are required');
        }

        // Get upload ID from fileUrl
        if (isset($input['fileUrl'])) {
            $fileUrl = $input['fileUrl'];
            $stmt = $pdo->prepare("SELECT id FROM uploads WHERE url = ?");
            $stmt->execute([$fileUrl]);
            $fileUpload = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($fileUpload) {
                $file_upload_id = $fileUpload['id'];
                error_log("File URL: $fileUrl -> Upload ID: $file_upload_id");
            } else {
                throw new Exception('File upload not found for URL: ' . $fileUrl);
            }
        } else {
            throw new Exception('fileUrl is required');
        }

        // Get upload ID from coverUrl (optional)
        if (isset($input['coverUrl'])) {
            $coverUrl = $input['coverUrl'];
            $stmt = $pdo->prepare("SELECT id FROM uploads WHERE url = ?");
            $stmt->execute([$coverUrl]);
            $coverUpload = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($coverUpload) {
                $cover_upload_id = $coverUpload['id'];
                error_log("Cover URL: $coverUrl -> Upload ID: $cover_upload_id");
            }
        }
    }

    // Insert opinion record (BOTH scenarios end up here)
    error_log("Inserting opinion: title=$title, author=$author_name, file_id=$file_upload_id, cover_id=$cover_upload_id");

    $stmt = $pdo->prepare("
        INSERT INTO opinions 
        (title, description, category, author_name, email, contact, tags, file_upload_id, cover_upload_id, views, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
    ");

    $stmt->execute([
        $title,
        $description,
        $category,
        $author_name,
        $email,
        $contact,
        $tags,
        $file_upload_id,
        $cover_upload_id
    ]);

    $opinionId = $pdo->lastInsertId();

    error_log("Opinion created with ID: $opinionId");

    echo json_encode([
        'ok' => true,
        'id' => (int)$opinionId,
        'message' => 'Opinion created successfully',
        'file_upload_id' => $file_upload_id,
        'cover_upload_id' => $cover_upload_id
    ]);
} catch (Exception $e) {
    error_log('Create opinion error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());

    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}
