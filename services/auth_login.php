<?php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_helper.php';

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw,true);
    if (!$data || empty($data['email']) || empty($data['password'])) { 
        echo json_encode(['ok'=>false,'message'=>'Data input tidak valid!']); 
        exit; 
    }

    $email = trim($data['email']);
    $password = $data['password'];

    $stmt = $pdo->prepare("SELECT id, password_hash, name, role, email FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) { 
        echo json_encode(['ok'=>false,'message'=>'Email tidak terdaftar!']); 
        exit; 
    }

    if (!password_verify($data['password'], $user['password_hash'])) {
        echo json_encode(['ok'=>false,'message'=>'Password salah!']); 
        exit;
    }

    // Set PHP Session (backward compatibility)
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['name'] = $user['name'];
    $_SESSION['email'] = $user['email'];

    // Generate JWT Tokens
    $accessToken = generate_access_token($user);
    $refreshToken = generate_refresh_token($user);
    
    echo json_encode([
        'ok'=>true,
        'user'=>[
            'id'=>$user['id'],
            'name'=>$user['name'],
            'role'=>$user['role']
        ],
        'access_token' => $accessToken['token'],
        'refresh_token' => $refreshToken['token'],
        'expires_in' => $accessToken['expires_in']
    ]);
} catch (Exception $e) {
    echo json_encode([
        'ok'=>false, 
        'message'=>'Server Error: ' . $e->getMessage()
    ]);
}
