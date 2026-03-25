<?php
require_once __DIR__ . '/services/db.php';

try {
    $stmt = $pdo->query("SELECT id, email, role, name FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: text/plain');
    echo "Total Users: " . count($users) . "\n\n";
    foreach ($users as $u) {
        echo "ID: {$u['id']} | Email: '{$u['email']}' | Role: {$u['role']} | Name: {$u['name']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
