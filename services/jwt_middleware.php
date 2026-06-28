<?php
/**
 * JWT Middleware — Hybrid Authentication (JWT + Session Fallback)
 * 
 * Include this file at the top of any protected endpoint.
 * It will set $auth_user with the authenticated user info.
 * 
 * Auth priority:
 *   1. JWT (Authorization: Bearer <token>)
 *   2. PHP Session ($_SESSION['user_id'])
 *   3. 401 Unauthorized
 * 
 * Usage:
 *   require_once __DIR__ . '/jwt_middleware.php';
 *   // $auth_user is now available: ['id', 'role', 'name', 'email', 'auth_method']
 *   // For admin-only endpoints, add: require_admin();
 * 
 * @package KSM Education
 */

require_once __DIR__ . '/jwt_helper.php';

/**
 * Authenticate the current request.
 * Sets global $auth_user on success.
 * Returns the authenticated user array or null.
 */
function authenticate_request(): ?array {
    global $auth_user;

    // === STRATEGY 1: JWT Token ===
    $jwt_payload = validate_jwt();
    if ($jwt_payload) {
        $auth_user = [
            'id'          => (int) $jwt_payload['sub'],
            'name'        => $jwt_payload['name'] ?? '',
            'role'        => $jwt_payload['role'] ?? 'user',
            'email'       => $jwt_payload['email'] ?? '',
            'auth_method' => 'jwt',
            'jti'         => $jwt_payload['jti'] ?? null
        ];
        return $auth_user;
    }

    // === STRATEGY 2: PHP Session (Fallback) ===
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!empty($_SESSION['user_id'])) {
        $auth_user = [
            'id'          => (int) $_SESSION['user_id'],
            'role'        => $_SESSION['role'] ?? 'user',
            'name'        => $_SESSION['name'] ?? '',
            'email'       => $_SESSION['email'] ?? '',
            'auth_method' => 'session'
        ];
        return $auth_user;
    }

    // === NO AUTH ===
    $auth_user = null;
    return null;
}

/**
 * Require authentication — returns 401 if not authenticated.
 * Call this in endpoints that MUST have a logged-in user.
 */
function require_auth(): array {
    $user = authenticate_request();
    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'ok' => false,
            'message' => 'Authentication required. Please login.',
            'code' => 'AUTH_REQUIRED'
        ]);
        exit;
    }
    return $user;
}

/**
 * Require admin role — returns 403 if not admin.
 * Must be called AFTER require_auth() or authenticate_request().
 */
function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'message' => 'Admin access required.',
            'code' => 'ADMIN_REQUIRED'
        ]);
        exit;
    }
    return $user;
}

/**
 * Optional authentication — authenticates if token/session is present,
 * but does NOT block the request if unauthenticated.
 * Useful for endpoints that behave differently for logged-in users.
 */
function optional_auth(): ?array {
    return authenticate_request();
}

// Auto-authenticate on include (sets $auth_user global)
$auth_user = null;
authenticate_request();
