<!DOCTYPE html>
<html lang="id">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= htmlspecialchars($page_title ?? 'KSM Education', ENT_QUOTES, 'UTF-8') ?></title>

  <script>
    (function() {
      try {
        var theme = localStorage.getItem('ksm_theme');
        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      } catch (e) {
        /* localStorage tidak tersedia (mode privat dsb) — abaikan, default light */
      }
    })();
  </script>

  <!-- Preconnect for Google Fonts CDN fallback -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <!-- Montserrat: offline-first via fonts.css, CDN sebagai fallback -->
  <link rel="stylesheet" href="../styles/base/fonts.css" />
  <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
  <?= $base_css ?? '' ?>
  <link rel="stylesheet" href="../styles/base/header.css?v=20260824_v111" />
  <link rel="stylesheet" href="../styles/base/toast.css" />
  <link rel="stylesheet" href="../styles/base/custom_alerts.css?v=20260907" />
  <link rel="stylesheet" href="../styles/user/journal.css?v=20260824_v103" />
  <link rel="stylesheet" href="../styles/base/footer.css" />
  <link rel="stylesheet" href="../styles/base/skeleton.css" />
  <script src="../js/config.js"></script>
  <script src="https://unpkg.com/feather-icons"></script>
  <?= $extra_head ?? '' ?>

  <link rel="stylesheet" href="../styles/base/dark_mode/dark_mode_p2.css?v=20260824" />
  <link rel="stylesheet" href="../styles/base/dark_mode/dark_mode_p3.css?v=20260801" />
  <link rel="stylesheet" href="../styles/base/dark_mode/dark_mode.css?v=20260801" />
  <link rel="stylesheet" href="../styles/base/dark_mode/dark_mode_p4.css?v=20260801" />
  <link rel="stylesheet" href="../styles/base/dark_mode/dark_mode_p5.css?v=20260802" />
</head>

<body>
