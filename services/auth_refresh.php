<?php
/**
 * POST /services/auth_refresh.php
 * 
 * Refresh an expired Access Token using a valid Refresh Token.
 * 
 * Request Body: { "refresh_token": "eyJ..." }
 * Response:     { "ok": true, "access_token": "eyJ...", "expires_in": 1800 }
 * 
 * @package KSM Education
 */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt_helper.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || empty($data['refresh_token'])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'refresh_token is required']);
        exit;
    }

    $refreshToken = trim($data['refresh_token']);

    // Decode and validate the refresh token
    $payload = jwt_decode($refreshToken, JWT_SECRET);
    if (!$payload) {
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'message' => 'Invalid or expired refresh token',
            'code' => 'REFRESH_INVALID'
        ]);
        exit;
    }

    // Ensure it's actually a refresh token
    if (!isset($payload['type']) || $payload['type'] !== 'refresh') {
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'message' => 'Token is not a refresh token',
            'code' => 'WRONG_TOKEN_TYPE'
        ]);
        exit;
    }

    // Check if refresh token is blacklisted
    if (isset($payload['jti'])) {
        try {
            $stmt = $pdo->prepare("SELECT id FROM jwt_blacklist WHERE token_jti = ? LIMIT 1");
            $stmt->execute([$payload['jti']]);
            if ($stmt->fetch()) {
                http_response_code(401);
                echo json_encode([
                    'ok' => false,
                    'message' => 'Refresh token has been revoked',
                    'code' => 'TOKEN_REVOKED'
                ]);
                exit;
            }
        } catch (Exception $e) {
            // Table might not exist — skip check
        }
    }

    // Fetch the latest user data from database
    $userId = (int) $payload['sub'];
    $stmt = $pdo->prepare("SELECT id, email, name, role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'message' => 'User no longer exists',
            'code' => 'USER_NOT_FOUND'
        ]);
        exit;
    }

    // Generate a new access token with fresh user data
    $accessToken = generate_access_token($user);

    echo json_encode([
        'ok' => true,
        'access_token' => $accessToken['token'],
        'expires_in' => $accessToken['expires_in'],
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'role' => $user['role']
        ]
    ]);

} catch (Exception $e) {
    error_log("Token refresh error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'message' => 'Server error during token refresh'
    ]);
}
