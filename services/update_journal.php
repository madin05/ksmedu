<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_middleware.php';

// ===== JWT AUTH: Admin Only =====
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'message' => 'Only POST allowed']);
    exit;
}

$id = isset($_POST['id']) ? (int) $_POST['id'] : 0;

if (!$id) {
    echo json_encode(['ok' => false, 'message' => 'id required']);
    exit;
}

try {
    $updates = [];
    $params  = [];

    if (!empty($_POST['title'])) {
        $updates[] = "title = ?";
        $params[]  = $_POST['title'];
    }

    if (!empty($_POST['abstract'])) {
        $updates[] = "abstract = ?";
        $params[]  = $_POST['abstract'];
    }

    if (!empty($_POST['email'])) {
        $updates[] = "email = ?";
        $params[]  = $_POST['email'];
    }

    if (!empty($_POST['contact'])) {
        $updates[] = "contact = ?";
        $params[]  = $_POST['contact'];
    }

    if (!empty($_POST['volume'])) {
        $updates[] = "volume = ?";
        $params[]  = $_POST['volume'];
    }

    if (isset($_POST['authors'])) {
        $authors = is_string($_POST['authors'])
            ? json_decode($_POST['authors'], true)
            : $_POST['authors'];

        if ($authors && is_array($authors)) {
            $updates[] = "authors = ?";
            $params[]  = json_encode($authors);
        }
    }

    if (isset($_POST['tags'])) {
        $tags = is_string($_POST['tags'])
            ? json_decode($_POST['tags'], true)
            : $_POST['tags'];

        if ($tags && is_array($tags)) {
            $updates[] = "tags = ?";
            $params[]  = json_encode($tags);
        }
    }

    if (isset($_POST['pengurus'])) {
        $pengurus = is_string($_POST['pengurus'])
            ? json_decode($_POST['pengurus'], true)
            : $_POST['pengurus'];

        if ($pengurus && is_array($pengurus)) {
            $updates[] = "pengurus = ?";
            $params[]  = json_encode($pengurus);
        }
    }

    // ========= FILE PDF (LEWAT serve_pdf.php) =========
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = UPLOAD_DIR_ABS;

        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $original_name = basename($_FILES['file']['name']);
        $file_name     = uniqid() . '_' . $original_name;
        $file_name     = str_replace(' ', '_', $file_name);
        $file_name     = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $file_name);

        $file_path = $upload_dir . $file_name;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $file_path)) {
            // path fisik relatif
            $file_url   = APP_ROOT . '/uploads/' . $file_name;
            // URL publik ke serve_pdf.php (di dalam /api)
            $public_url = APP_ROOT . '/services/serve_pdf.php?file=' . urlencode($file_url);



            $stmt = $pdo->prepare("INSERT INTO uploads (filename, url, created_at) VALUES (?, ?, NOW())");
            $stmt->execute([$file_name, $public_url]);

            $file_upload_id = $pdo->lastInsertId();

            $updates[] = "file_upload_id = ?";
            $params[]  = $file_upload_id;

            // hapus file lama (fisik)
            $old = $pdo->prepare("SELECT file_upload_id FROM journals WHERE id = ?");
            $old->execute([$id]);
            $oldData = $old->fetch(PDO::FETCH_ASSOC);

            if ($oldData && $oldData['file_upload_id']) {
                $oldFile = $pdo->prepare("SELECT url FROM uploads WHERE id = ?");
                $oldFile->execute([$oldData['file_upload_id']]);
                $oldFileData = $oldFile->fetch(PDO::FETCH_ASSOC);

                if ($oldFileData && !empty($oldFileData['url'])) {
                    // url lama bentuknya: [APP_ROOT]/serve_pdf.php?file=[APP_ROOT]/uploads/xxx.pdf
                    $parts = parse_url($oldFileData['url']);
                    parse_str($parts['query'] ?? '', $q);
                    $oldRel = $q['file'] ?? null;

                    if ($oldRel) {
                        $oldFilePath = $_SERVER['DOCUMENT_ROOT'] . $oldRel;
                        if (file_exists($oldFilePath)) {
                            @unlink($oldFilePath);
                        }
                    }
                }
            }
        }
    }

    // ========= COVER IMAGE (LANGSUNG URL) =========
    if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = UPLOAD_DIR_ABS;

        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $original_cover = basename($_FILES['cover']['name']);
        $cover_name     = uniqid() . '_' . $original_cover;
        $cover_name     = str_replace(' ', '_', $cover_name);
        $cover_name     = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $cover_name);

        $cover_path = $upload_dir . $cover_name;

        if (move_uploaded_file($_FILES['cover']['tmp_name'], $cover_path)) {
            $stmt = $pdo->prepare(
                "INSERT INTO uploads (filename, url, created_at) VALUES (?, ?, NOW())"
            );
            $stmt->execute([$cover_name, APP_ROOT . '/uploads/' . $cover_name]);
            $cover_upload_id = $pdo->lastInsertId();

            $updates[] = "cover_upload_id = ?";
            $params[]  = $cover_upload_id;

            // hapus cover lama
            $old = $pdo->prepare("SELECT cover_upload_id FROM journals WHERE id = ?");
            $old->execute([$id]);
            $oldData = $old->fetch(PDO::FETCH_ASSOC);

            if ($oldData && $oldData['cover_upload_id']) {
                $oldCover = $pdo->prepare("SELECT url FROM uploads WHERE id = ?");
                $oldCover->execute([$oldData['cover_upload_id']]);
                $oldCoverData = $oldCover->fetch(PDO::FETCH_ASSOC);

                if ($oldCoverData && !empty($oldCoverData['url'])) {
                    $oldCoverPath = $_SERVER['DOCUMENT_ROOT'] . $oldCoverData['url'];
                    if (file_exists($oldCoverPath)) {
                        @unlink($oldCoverPath);
                    }
                }
            }
        }
    }

    // ========= EKSEKUSI UPDATE =========
    if (!empty($updates)) {
        $updates[] = "updated_at = NOW()";
        $params[]  = $id;

        $sql  = "UPDATE journals SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode([
            'ok'      => true,
            'id'      => $id,
            'message' => 'Journal updated successfully',
        ]);
    } else {
        echo json_encode(['ok' => false, 'message' => 'No changes detected']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => $e->getMessage()]);
}
