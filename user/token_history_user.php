<?php
$page_title = 'Riwayat Token - KSM Education';
$base_css = '<link rel="stylesheet" href="../styles/user/dashboard_user.css?v=20260902_v108" />
  <link rel="stylesheet" href="../styles/user/token_wallet.css?v=20260715" />
  <link rel="stylesheet" href="../styles/user/upload_journal_modal.css?v=20260715" />
  <link rel="stylesheet" href="../styles/user/my_journals_user.css?v=20260715" />
  <link rel="stylesheet" href="../styles/user/token_history_user.css?v=20260902_v109" />';
include 'components/header.php';
include 'components/navbar.php';
?>

    <div class="container">
      <section class="ksm-page-heading">
        <div>
          <h2>Riwayat Token</h2>
          <p class="ksm-page-subtitle">
            Riwayat permintaan pembelian token &amp; status validasi dari
            admin.
          </p>
        </div>
        <button type="button" class="ksm-btn-solid-dark" data-ksm-open-buy-token>
          <i data-feather="shopping-cart"></i>
          Beli Token
        </button>
      </section>

      <!-- ===== RINGKASAN SALDO ===== -->
      <div class="ksm-token-summary-banner">
        <div class="ksm-token-summary-item">
          <span class="label">Saldo Token Saat Ini</span>
          <span class="value" data-ksm-token-balance>0</span>
        </div>
        <div class="ksm-token-summary-item">
          <span class="label">Total Permintaan</span>
          <span class="value" id="ksmTotalRequests">0</span>
        </div>
        <div class="ksm-token-summary-item">
          <span class="label">Sedang Diproses</span>
          <span class="value" id="ksmPendingRequests">0</span>
        </div>
      </div>

      <!-- ===== FILTER TABS ===== -->
      <div class="ksm-filter-tabs" id="ksmTokenHistoryFilters">
        <button type="button" class="ksm-filter-tab active" data-filter="all">
          Semua
        </button>
        <button type="button" class="ksm-filter-tab" data-filter="pending">
          Pending
        </button>
        <button type="button" class="ksm-filter-tab" data-filter="approved">
          Disetujui
        </button>
        <button type="button" class="ksm-filter-tab" data-filter="rejected">
          Ditolak
        </button>
      </div>

      <div class="ksm-history-selection-bar">
        <label class="ksm-history-select-all">
          <input type="checkbox" id="ksmSelectAllHistory" />
          <span>Pilih semua</span>
        </label>
        <span class="ksm-history-selected-count" id="ksmHistorySelectedCount" aria-live="polite"></span>
        <button type="button" class="ksm-history-delete-btn" id="ksmDeleteSelectedHistory" disabled>
          <i data-feather="trash-2"></i>
          Hapus Riwayat
        </button>
      </div>

      <!-- ===== LIST ===== -->
      <section class="ksm-token-history-list" id="ksmTokenHistoryList">
        <!-- Diisi oleh js/token_history_user.js -->
      </section>
    </div>

    <?php
    include 'components/token_modal.php';
    ?>

<?php
$extra_scripts = <<<'EOT'
<script src="../js/script.js?v=2025112910"></script>
     <script src="../js/custom_alerts.js?v=20260905"></script>
    <script src="../js/api.js?v=20260729"></script>
    <script src="../js/token_wallet.js?v=20260905_fix"></script>
    <script src="../js/token_history_user.js?v=20260905_fix"></script>
    <script src="../js/mobile_menu.js?v=20251130"></script>
    <script>
      feather.replace();
    </script>
  
EOT;
include 'components/footer.php';
?>
