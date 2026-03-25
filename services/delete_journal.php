<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';

try {
    //  Support multiple methods to get ID
    $id = null;
    
    // Method 1: From query string (GET/DELETE with ?id=X)
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
    }
    
    // Method 2: From POST body
    if (!$id && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $postData = json_decode(file_get_contents('php://input'), true);
        if (isset($postData['id'])) {
            $id = $postData['id'];
        }
    }
    
    // Method 3: From DELETE body
    if (!$id && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $deleteData = json_decode(file_get_contents('php://input'), true);
        if (isset($deleteData['id'])) {
            $id = $deleteData['id'];
        }
    }
    
    //  Validate ID
    if (!$id) {
        error_log('Delete journal error: No ID provided');
        error_log('GET params: ' . print_r($_GET, true));
        error_log('Request method: ' . $_SERVER['REQUEST_METHOD']);
        throw new Exception('ID required');
    }
    
    error_log('Attempting to delete journal with ID: ' . $id);
    
    //  Check if journal exists first
    $checkStmt = $pdo->prepare("SELECT id FROM journals WHERE id = ?");
    $checkStmt->execute([$id]);
    
    if ($checkStmt->rowCount() === 0) {
        throw new Exception('Journal not found');
    }
    
    //  Delete journal from database
    $stmt = $pdo->prepare("DELETE FROM journals WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        error_log('Journal deleted successfully: ID ' . $id);
        echo json_encode([
            'ok' => true, 
            'message' => 'Journal deleted successfully',
            'id' => $id
        ]);
    } else {
        throw new Exception('Failed to delete journal');
    }
    
} catch (Exception $e) {
    error_log('Delete journal error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false, 
        'message' => $e->getMessage()
    ]);
}
?>
