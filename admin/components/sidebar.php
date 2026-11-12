<?php
// admin/components/sidebar.php
// Sidebar panel admin (collapsible) + topbar ramping.
// Menu dibuat flat per seksi (tanpa dropdown) agar 1 klik sampai tujuan.
// Halaman aktif ditandai otomatis dari nama file yang sedang dibuka.
//
// Kompatibilitas JS lama:
//  - id badge navBadgeReview / navBadgeContact / navBadgeToken dipertahankan
//    (diisi js/admin_nav.js dari services/admin/dashboard_stats.php).
//  - class .admin-nav dipertahankan (dipakai admin_nav.js & mobile_menu.js).

$current_page = basename($_SERVER['PHP_SELF']);

/**
 * 'file' = nama skrip asli (dipakai untuk menandai halaman aktif).
 * 'url'  = clean URL yang dipakai pada atribut href.
 * 'badge' = id elemen badge yang diisi js/admin_nav.js.
 */
$nav_sections = [
    [
        'label' => 'Konten',
        'items' => [
            ['file' => 'journals.php',     'url' => 'journals', 'label' => 'Artikel Jurnal', 'icon' => 'book'],
            ['file' => 'opinions.php',     'url' => 'opinions', 'label' => 'Artikel Opini',  'icon' => 'edit-3'],
            ['file' => 'upload_admin.php', 'url' => 'upload',   'label' => 'Upload Artikel', 'icon' => 'upload-cloud'],
        ],
    ],
    [
        'label' => 'Moderasi',
        'items' => [
            ['file' => 'review_journals.php',  'url' => 'review_journals',  'label' => 'Review Kiriman', 'icon' => 'inbox',          'badge' => 'navBadgeReview'],
            ['file' => 'comments.php',         'url' => 'comments',         'label' => 'Komentar',       'icon' => 'message-square'],
            ['file' => 'contact_messages.php', 'url' => 'contact_messages', 'label' => 'Pesan Kontak',   'icon' => 'mail',           'badge' => 'navBadgeContact'],
        ],
    ],
    [
        'label' => 'Operasional',
        'items' => [
            ['file' => 'token_requests.php',    'url' => 'token_requests',    'label' => 'Verifikasi Token', 'icon' => 'credit-card', 'badge' => 'navBadgeToken'],
            ['file' => 'visitor_analytics.php', 'url' => 'visitor_analytics', 'label' => 'Analitik',         'icon' => 'bar-chart-2'],
        ],
    ],
];

$page_titles = [
    'dashboard_admin.php'   => 'Dashboard',
    'journals.php'          => 'Artikel Jurnal',
    'opinions.php'          => 'Artikel Opini',
    'upload_admin.php'      => 'Upload Artikel',
    'review_journals.php'   => 'Review Kiriman',
    'comments.php'          => 'Moderasi Komentar',
    'contact_messages.php'  => 'Pesan Kontak',
    'token_requests.php'    => 'Verifikasi Token',
    'visitor_analytics.php' => 'Analitik Pengunjung',
    'explore_jurnal_admin.php' => 'Pratinjau Jurnal',
    'explore_opini_admin.php'  => 'Pratinjau Opini',
];
$topbar_title = $page_titles[$current_page] ?? 'Admin Panel';
$is_home_active = ($current_page === 'dashboard_admin.php');

$admin_display_name = htmlspecialchars(
    $admin_session_user['name'] ?? 'Administrator',
    ENT_QUOTES,
    'UTF-8'
);
$admin_email = htmlspecialchars(
    $admin_session_user['email'] ?? 'admin@ksmeducation.com',
    ENT_QUOTES,
    'UTF-8'
);
$admin_initial = strtoupper(mb_substr($admin_session_user['name'] ?? 'A', 0, 1, 'UTF-8'));
?>
<div class="admin-overlay" id="adminOverlay" aria-hidden="true"></div>

<aside class="admin-sidebar" id="adminSidebar" aria-label="Sidebar admin">
  <div class="sidebar-brand">
    <a href="dashboard" class="brand-link" title="KSM Education - Dashboard admin">
      <img src="../assets/main_logo.png" alt="Logo KSM Education" />
      <span class="brand-text">KSM<small>Admin Panel</small></span>
    </a>
    <button
      id="sidebarCollapse"
      class="sidebar-collapse-btn"
      type="button"
      title="Ciutkan / bentangkan sidebar"
      aria-label="Ciutkan atau bentangkan sidebar"
      aria-expanded="true"
    >
      <i data-feather="chevrons-left"></i>
    </button>
  </div>

  <nav class="admin-nav" aria-label="Navigasi admin">
    <a
      href="dashboard"
      class="side-link<?php echo $is_home_active ? ' active' : ''; ?>"
      title="Dashboard"
      <?php echo $is_home_active ? 'aria-current="page"' : ''; ?>
    >
      <span class="side-icon"><i data-feather="home"></i></span>
      <span class="side-label">Dashboard</span>
    </a>

    <?php foreach ($nav_sections as $section): ?>
      <div class="side-section">
        <span class="side-section-label"><?php echo $section['label']; ?></span>
        <?php foreach ($section['items'] as $item): ?>
          <?php $is_active = ($item['file'] === $current_page); ?>
          <a
            href="<?php echo $item['url']; ?>"
            class="side-link<?php echo $is_active ? ' active' : ''; ?>"
            title="<?php echo $item['label']; ?>"
            <?php echo $is_active ? 'aria-current="page"' : ''; ?>
          >
            <span class="side-icon"><i data-feather="<?php echo $item['icon']; ?>"></i></span>
            <span class="side-label"><?php echo $item['label']; ?></span>
            <?php if (isset($item['badge'])): ?>
              <span class="nav-badge" id="<?php echo $item['badge']; ?>"></span>
            <?php endif; ?>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endforeach; ?>
  </nav>

  <div class="sidebar-footer">
    <div class="sidebar-profile" title="<?php echo $admin_email; ?>">
      <span class="sidebar-avatar" aria-hidden="true"><?php echo $admin_initial; ?></span>
      <span class="sidebar-profile-text">
        <strong><?php echo $admin_display_name; ?></strong>
        <small><?php echo $admin_email; ?></small>
      </span>
      <a
        class="sidebar-logout"
        href="../services/auth_logout.php?redirect=<?php echo urlencode('../admin/login'); ?>"
        title="Logout"
        aria-label="Logout"
      >
        <i data-feather="log-out"></i>
      </a>
    </div>
  </div>
</aside>

<header class="admin-topbar">
  <div class="topbar-left">
    <button
      class="hamburger-menu"
      aria-label="Buka / tutup menu"
      aria-expanded="false"
      type="button"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div class="topbar-title">
      <span class="topbar-crumb">Admin</span>
      <h1><?php echo htmlspecialchars($topbar_title, ENT_QUOTES, 'UTF-8'); ?></h1>
    </div>
  </div>
  <div class="topbar-right">
    <a class="topbar-site-link" href="../" title="Lihat situs utama">
      <i data-feather="external-link"></i>
      <span>Lihat Situs</span>
    </a>
  </div>
</header>

<script>
  document.body.classList.add('has-admin-sidebar');
</script>
