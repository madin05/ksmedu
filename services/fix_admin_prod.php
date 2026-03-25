<?php
/**
 * FIX_ADMIN_PROD.PHP
 * Resets the admin user on production to ensure credentials match login.js
 */

header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/db.php';

echo "===== Admin Reset Utility =====\n\n";

try {
    $email = 'admin@ksmeducation.com';
    $password = 'admin123';
    $name = 'Administrator';
    $role = 'admin';
    $hash = password_hash($password, PASSWORD_DEFAULT);

    echo "[INFO] Targeting email: $email\n";

    // 1. Delete existing if any
    $pdo->prepare("DELETE FROM users WHERE email = ?")->execute([$email]);
    echo "[INFO] Old record cleared (if any).\n";

    // 2. Insert fresh
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $hash, $name, $role]);
    
    echo "[SUCCESS] Admin account has been reset/created.\n";
    echo "Email: $email\n";
    echo "Password: $password\n";
    echo "\n===== Done =====\n";

} catch (Exception $e) {
    echo "\n[CRITICAL ERROR] Failed: " . $e->getMessage() . "\n";
}
