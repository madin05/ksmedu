<?php
// Dynamic path for API endpoint, e.g., /api/serve_pdf.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/db.php';

header('Access-Control-Allow-Origin: *');

// Ambil parameter ?file=/uploads/xxx.pdf
$file = isset($_GET['file']) ? $_GET['file'] : '';

// Cek basic security
if (!$file || strpos($file, '..') !== false) {
    http_response_code(403);
    echo 'Invalid file path';
    exit;
}

// Pastikan selalu pakai path absolut mulai dari APP_ROOT
if (strpos($file, APP_ROOT . '/') !== 0) {
    // kalau yang dikirim cuma /uploads/... atau nama file
    $file = APP_ROOT . '/uploads/' . ltrim($file, '/');
}

// Path absolut di server
$filepath = $_SERVER['DOCUMENT_ROOT'] . $file;

// Kalau file gak ketemu -> 404
if (!file_exists($filepath)) {
    http_response_code(404);
    echo 'File not found: ' . htmlspecialchars($file);
    exit;
}

// Paksa browser preview PDF
header_remove('Content-Type');
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . basename($filepath) . '"');
header('Content-Transfer-Encoding: binary');
header('Accept-Ranges: bytes');
header('Content-Length: ' . filesize($filepath));
header('X-Content-Type-Options: nosniff');

readfile($filepath);
exit;
