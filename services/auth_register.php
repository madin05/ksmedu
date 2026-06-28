<?php
// api/auth_register.php
session_start();
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_helper.php';

// Set header JSON
header('Content-Type: application/json; charset=utf-8');

// Get raw POST data
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || empty($data['name']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode(['ok' => false, 'message' => 'Semua field wajib diisi!']);
    exit;
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = $data['password'];

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'message' => 'Format email tidak valid!']);
    exit;
}

// Check password length
if (strlen($password) < 6) {
    echo json_encode(['ok' => false, 'message' => 'Password minimal 6 karakter!']);
    exit;
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['ok' => false, 'message' => 'Email sudah terdaftar!']);
        exit;
    }

    // Hash password
    $hash = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')");
    $stmt->execute([$name, $email, $hash]);

    $userId = $pdo->lastInsertId();

    // Set PHP Session (backward compatibility)
    $_SESSION['user_id'] = $userId;
    $_SESSION['role'] = 'user';
    $_SESSION['name'] = $name;
    $_SESSION['email'] = $email;

    // Generate JWT Tokens
    $userData = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => 'user'
    ];
    $accessToken = generate_access_token($userData);
    $refreshToken = generate_refresh_token($userData);

    echo json_encode([
        'ok' => true, 
        'message' => 'Registrasi berhasil!',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'user'
        ],
        'access_token' => $accessToken['token'],
        'refresh_token' => $refreshToken['token'],
        'expires_in' => $accessToken['expires_in']
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    echo json_encode(['ok' => false, 'message' => 'Terjadi kesalahan sistem. Coba lagi nanti.']);
}
