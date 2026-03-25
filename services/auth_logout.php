<?php
session_start();
header('Content-Type: application/json');
$_SESSION = array();
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

if (isset($_GET['redirect'])) {
    header('Location: ' . $_GET['redirect']);
    exit;
}

echo json_encode(['ok'=>true]);
