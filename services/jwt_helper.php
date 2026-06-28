<?php
/**
 * JWT Helper — Pure PHP JWT Implementation (No External Dependencies)
 * 
 * Implements RFC 7519 JSON Web Token with HMAC-SHA256 signing.
 * Provides access token (30 min) + refresh token (7 days) pattern.
 * 
 * @package KSM Education
 */

require_once __DIR__ . '/env_loader.php';

// ===== JWT CONFIGURATION =====
$jwt_secret_val = get_env_var('JWT_SECRET', '');
if (empty($jwt_secret_val) || strpos($jwt_secret_val, 'change_this') !== false || strpos($jwt_secret_val, 'ch4ng3_th1s') !== false) {
    error_log('CRITICAL: JWT_SECRET is not configured properly in .env file!');
    if (php_sapi_name() !== 'cli') {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'JWT configuration error.']);
        exit;
    }
}
define('JWT_SECRET', $jwt_secret_val);
define('JWT_ACCESS_EXPIRY', (int) get_env_var('JWT_ACCESS_EXPIRY', '1800'));      // 30 minutes
define('JWT_REFRESH_EXPIRY', (int) get_env_var('JWT_REFRESH_EXPIRY', '604800'));  // 7 days
define('JWT_ISSUER', 'ksm-education');
define('JWT_ALGORITHM', 'HS256');

// ===== BASE64URL ENCODING (RFC 4648) =====

/**
 * Base64URL encode (URL-safe, no padding)
 */
function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Base64URL decode
 */
function base64url_decode(string $data): string {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

// ===== JWT CORE FUNCTIONS =====

/**
 * Encode (sign) a JWT token
 * 
 * @param array  $payload The claims (data) to include in the token
 * @param string $secret  The secret key for HMAC signing
 * @return string The signed JWT token string
 */
function jwt_encode(array $payload, string $secret): string {
    // Header
    $header = [
        'typ' => 'JWT',
        'alg' => JWT_ALGORITHM
    ];

    // Encode header & payload
    $headerEncoded = base64url_encode(json_encode($header, JSON_UNESCAPED_SLASHES));
    $payloadEncoded = base64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));

    // Create signature
    $signatureInput = $headerEncoded . '.' . $payloadEncoded;
    $signature = hash_hmac('sha256', $signatureInput, $secret, true);
    $signatureEncoded = base64url_encode($signature);

    return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
}

/**
 * Decode and validate a JWT token
 * 
 * @param string $token  The JWT token string
 * @param string $secret The secret key for HMAC verification
 * @return array|false   The decoded payload, or false on failure
 */
function jwt_decode(string $token, string $secret) {
    // Split token
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    // Verify signature
    $signatureInput = $headerEncoded . '.' . $payloadEncoded;
    $expectedSignature = base64url_encode(hash_hmac('sha256', $signatureInput, $secret, true));

    if (!hash_equals($expectedSignature, $signatureEncoded)) {
        return false; // Invalid signature
    }

    // Decode header
    $header = json_decode(base64url_decode($headerEncoded), true);
    if (!$header || !isset($header['alg']) || $header['alg'] !== JWT_ALGORITHM) {
        return false; // Unsupported algorithm
    }

    // Decode payload
    $payload = json_decode(base64url_decode($payloadEncoded), true);
    if (!$payload) {
        return false; // Invalid payload
    }

    // Check expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; // Token expired
    }

    // Check "not before" claim
    if (isset($payload['nbf']) && $payload['nbf'] > time()) {
        return false; // Token not yet valid
    }

    // Verify issuer
    if (isset($payload['iss']) && $payload['iss'] !== JWT_ISSUER) {
        return false; // Invalid issuer
    }

    return $payload;
}

// ===== TOKEN GENERATION =====

/**
 * Generate a unique JWT ID (jti)
 */
function generate_jti(): string {
    return bin2hex(random_bytes(16));
}

/**
 * Generate an Access Token (short-lived, 30 minutes default)
 * 
 * @param array $user User data ['id', 'name', 'role', 'email']
 * @return array ['token' => string, 'expires_in' => int, 'jti' => string]
 */
function generate_access_token(array $user): array {
    $jti = generate_jti();
    $now = time();

    $payload = [
        'iss' => JWT_ISSUER,
        'sub' => (int) $user['id'],
        'iat' => $now,
        'exp' => $now + JWT_ACCESS_EXPIRY,
        'nbf' => $now,
        'jti' => $jti,
        'type' => 'access',
        'name' => $user['name'] ?? '',
        'role' => $user['role'] ?? 'user',
        'email' => $user['email'] ?? ''
    ];

    return [
        'token' => jwt_encode($payload, JWT_SECRET),
        'expires_in' => JWT_ACCESS_EXPIRY,
        'jti' => $jti
    ];
}

/**
 * Generate a Refresh Token (long-lived, 7 days default)
 * 
 * @param array $user User data ['id', 'role']
 * @return array ['token' => string, 'expires_in' => int, 'jti' => string]
 */
function generate_refresh_token(array $user): array {
    $jti = generate_jti();
    $now = time();

    $payload = [
        'iss' => JWT_ISSUER,
        'sub' => (int) $user['id'],
        'iat' => $now,
        'exp' => $now + JWT_REFRESH_EXPIRY,
        'nbf' => $now,
        'jti' => $jti,
        'type' => 'refresh',
        'role' => $user['role'] ?? 'user'
    ];

    return [
        'token' => jwt_encode($payload, JWT_SECRET),
        'expires_in' => JWT_REFRESH_EXPIRY,
        'jti' => $jti
    ];
}

// ===== TOKEN VALIDATION =====

/**
 * Extract Bearer token from Authorization header
 * 
 * @return string|null The token, or null if not found
 */
function get_bearer_token(): ?string {
    // Check Authorization header
    $authHeader = null;

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        // Apache redirect workaround
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }

    if ($authHeader && preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        return trim($matches[1]);
    }

    return null;
}

/**
 * Validate JWT from the Authorization header
 * Returns the decoded payload if valid, null otherwise.
 * Does NOT send any HTTP response — caller must handle auth failure.
 * 
 * @return array|null Decoded JWT payload, or null if invalid/missing
 */
function validate_jwt(): ?array {
    $token = get_bearer_token();
    if (!$token) {
        return null;
    }

    $payload = jwt_decode($token, JWT_SECRET);
    if (!$payload) {
        return null;
    }

    // Ensure it's an access token (not a refresh token)
    if (isset($payload['type']) && $payload['type'] !== 'access') {
        return null;
    }

    // Check blacklist (if database is available)
    if (isset($payload['jti'])) {
        try {
            global $pdo;
            if ($pdo) {
                $stmt = $pdo->prepare("SELECT id FROM jwt_blacklist WHERE token_jti = ? LIMIT 1");
                $stmt->execute([$payload['jti']]);
                if ($stmt->fetch()) {
                    return null; // Token has been revoked
                }
            }
        } catch (Exception $e) {
            // Table might not exist yet — skip blacklist check
        }
    }

    return $payload;
}

/**
 * Blacklist a token JTI (used during logout)
 * 
 * @param string $jti       The JWT ID to blacklist
 * @param int    $expiresAt Unix timestamp when the token expires
 * @return bool Success
 */
function blacklist_token(string $jti, int $expiresAt): bool {
    try {
        global $pdo;
        if (!$pdo) return false;

        // Auto-create table if it doesn't exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS jwt_blacklist (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token_jti VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY idx_jti (token_jti),
            INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // Insert into blacklist
        $stmt = $pdo->prepare("INSERT IGNORE INTO jwt_blacklist (token_jti, expires_at) VALUES (?, ?)");
        $stmt->execute([$jti, date('Y-m-d H:i:s', $expiresAt)]);

        // Cleanup expired entries (housekeeping)
        $pdo->exec("DELETE FROM jwt_blacklist WHERE expires_at < NOW()");

        return true;
    } catch (Exception $e) {
        error_log("JWT Blacklist error: " . $e->getMessage());
        return false;
    }
}
