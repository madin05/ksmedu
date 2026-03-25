<?php
// user/components/header.php
?>
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo isset($page_title) ? $page_title : 'KSM Education'; ?></title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="shortcut icon" type="image/x-icon" href="../assets/favicon.ico" />
    <?php if (isset($base_css)) echo $base_css; ?>
    <link rel="stylesheet" href="../styles/header.css?v=20260323" />
    <link rel="stylesheet" href="../styles/toast.css" />
    <link rel="stylesheet" href="../styles/custom_alerts.css" />
    <link rel="stylesheet" href="../styles/journal.css?v=20260321" />
    <link rel="stylesheet" href="../styles/footer.css" />
    <link rel="stylesheet" href="../styles/skeleton.css" />
    <script src="../js/config.js"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <?php if (isset($extra_head)) echo $extra_head; ?>
  </head>
  <body>
