<?php
// admin/components/header.php
?>
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo isset($page_title) ? $page_title : 'KSM Education - Admin'; ?></title>
    <!-- Preconnect for Google Fonts CDN fallback -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <!-- Montserrat: offline-first via fonts.css, CDN sebagai fallback -->
    <link rel="stylesheet" href="../styles/fonts.css" />
    <link rel="stylesheet" href="../styles/admin.css?v=20260323" />
    <link rel="stylesheet" href="../styles/skeleton.css" />
    <link rel="stylesheet" href="../styles/custom_alerts.css" />
    <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
    <script src="../js/config.js"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <?php if (isset($extra_head)) echo $extra_head; ?>
  </head>
  <body>
