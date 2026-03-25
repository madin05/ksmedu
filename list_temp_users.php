<?php
require_once __DIR__ . '/services/db.php';

try {
    $stmt = $pdo->query("SELECT email, role FROM users WHERE role = 'admin'");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Admin Users found:\n";
    foreach ($admins as $admin) {
        echo "Email: " . $admin['email'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
