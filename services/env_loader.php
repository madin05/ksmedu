<?php
/**
 * Simple .env loader for PHP
 * Loads variables from .env file into $_ENV and putenv()
 */

function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse key=value
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        // Remove quotes if present
        if (!empty($value) && (strpos($value, '"') === 0 || strpos($value, "'") === 0)) {
            $value = substr($value, 1, -1);
        }

        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    return true;
}

// Automatically load from root if possible
$envPath = __DIR__ . '/../.env';
loadEnv($envPath);
