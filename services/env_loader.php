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
        $trimmed = trim($line);

        // Skip blank lines and comments
        if ($trimmed === '' || $trimmed[0] === '#' || $trimmed[0] === ';') {
            continue;
        }

        // Baris tanpa '=' bukan pasangan key=value (mis. penanda section atau
        // baris rusak). Dilewati agar tidak memicu "Undefined array key 1".
        if (strpos($trimmed, '=') === false) {
            continue;
        }

        // Parse key=value
        [$name, $value] = explode('=', $trimmed, 2);
        $name = trim($name);
        $value = trim($value);

        if ($name === '') {
            continue;
        }

        // Buang kutip pembungkus hanya bila berpasangan, supaya nilai seperti
        // "abc (tanpa penutup) tidak kehilangan karakter terakhirnya.
        $len = strlen($value);
        if ($len >= 2) {
            $first = $value[0];
            $last = $value[$len - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                $value = substr($value, 1, -1);
            }
        }


        putenv(sprintf('%s=%s', $name, $value));
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
    return true;
}

// Automatically load from root if possible, or 1 level above public_html in cPanel
$envPath = __DIR__ . '/../.env';
if (!loadEnv($envPath)) {
    loadEnv(dirname(__DIR__, 2) . '/.env');
}
