<?php
// db.php

// Set header agar browser mengenali output sebagai JSON dengan encoding UTF-8
header('Content-Type: application/json; charset=utf-8');

// Opsi CORS (Cross-Origin Resource Sharing) untuk pengembangan (bisa di-uncomment jika butuh)
// header('Access-Control-Allow-Origin: http://localhost:3000');
// header('Access-Control-Allow-Credentials: true');

// Load environment variables
require_once __DIR__ . '/env_loader.php';

// Definisi konstanta dan variabel untuk koneksi database
$DB_HOST = getenv('DB_HOST') ?: 'localhost';
$DB_NAME = getenv('DB_NAME') ?: 'journal_system2';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$DB_PORT = getenv('DB_PORT') ?: '3306';

try {
    // Buat instance PDO baru untuk menghubungkan PHP ke MySQL
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        // Mode error: lemparkan exception jika ada kesalahan query
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        // Mode fetch default: kembalikan hasil query sebagai array asosiatif
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    // 4. Penanganan Error Koneksi
    http_response_code(500);

    // Cek apakah request berasal dari browser (bukan AJAX/Fetch)
    $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
    $isApiCall = strpos($_SERVER['REQUEST_URI'], '/api/') !== false;

    if (!$isAjax && !$isApiCall) {
        // Jika diakses langsung via browser, redirect ke halaman error premium
        header('Location: /ksmaja/db_error.html');
        exit;
    }

    // Kirim pesan error dalam format JSON untuk API/AJAX
    echo json_encode(['ok' => false, 'message' => 'DB connection failed']);
    exit;
}
