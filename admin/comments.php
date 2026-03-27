<?php
$page_title = 'Kelola Komentar - KSM Admin';
$extra_head = '
  <link rel="stylesheet" href="../styles/explore_admin.css" />
  <link rel="stylesheet" href="../styles/comments_admin.css?v=' . time() . '" />';
include 'components/header.php';
include 'components/sidebar.php';
?>

<div class="admin-comments-page" style="max-width:1100px;margin:32px auto;padding:0 24px;">

  <!-- Page Header -->
  <div class="page-header" style="margin-bottom:24px;">
    <h1 style="font-size:1.8rem;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;">
      <i data-feather="message-circle" style="color:#3b82f6;width:28px;height:28px;"></i>
      Kelola Komentar
    </h1>
    <p style="color:#64748b;margin-top:4px;">Lihat dan hapus semua komentar dari seluruh artikel.</p>
  </div>

  <!-- Filters -->
  <div class="comments-filters">
    <div class="filter-row-left">
      <!-- Icon Sort Dropdown -->
      <div class="sort-dropdown">
        <button class="btn-icon-sort" type="button" id="btnFilterTrigger">
          <i data-feather="filter"></i>
        </button>
        <div class="sort-menu" id="filterSortMenu">
          <div class="menu-section-label">TIPE ARTIKEL</div>
          <button data-type="" class="filter-type-item active">Semua Tipe</button>
          <button data-type="jurnal" class="filter-type-item">Jurnal</button>
          <button data-type="opini" class="filter-type-item">Opini</button>
          
          <div class="menu-separator"></div>
          
          <div class="menu-section-label">URUTKAN</div>
          <button data-sort="newest" class="filter-sort-item active">
            <i data-feather="clock"></i> Terbaru
          </button>
          <button data-sort="oldest" class="filter-sort-item">
            <i data-feather="calendar"></i> Terlama
          </button>
          <button data-sort="user_az" class="filter-sort-item">
            <i data-feather="user"></i> User A-Z
          </button>
        </div>
      </div>
    </div>

    <div class="filter-row-right">
      <div class="filter-group">
        <div class="search-box-wrapper">
          <i data-feather="search"></i>
          <input
            id="searchInput"
            class="search-input"
            type="text"
            placeholder="Cari username atau isi komentar..." />
        </div>
        <button onclick="loadAllComments()" class="btn-search">
          Cari
        </button>
      </div>
      <span id="totalCount"></span>
    </div>
  </div>

  <!-- Comments Table -->
  <div style="background:white;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;border:1px solid #e2e8f0;">
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:800px;" id="commentsTable">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Pengguna</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Tipe</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Komentar</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Tanggal</th>
            <th style="padding:14px 16px;text-align:center;font-size:13px;font-weight:600;color:#64748b;">Aksi</th>
          </tr>
        </thead>
        <tbody id="commentsTableBody">
          <tr>
            <td colspan="5" style="padding:48px;text-align:center;color:#94a3b8;">
              <div class="loading-spinner" style="margin:0 auto 12px;"></div>
              Memuat komentar...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pagination -->
  <div id="pagination" style="display:flex;justify-content:center;gap:8px;margin:24px 0;flex-wrap:wrap;"></div>

</div>

<?php
$extra_scripts = '
<script src="../js/custom_alerts.js"></script>
<script src="../js/comments_admin.js?v=' . time() . '"></script>
<script>
  if (typeof feather !== "undefined") feather.replace();
</script>';
include 'components/footer.php';
?>
