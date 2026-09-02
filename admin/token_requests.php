<?php
// admin/token_requests.php
// Verifikasi manual top-up token (pembelian via Telegram) + riwayat transaksi
// seluruh user.
// Endpoint yang dipakai:
//   GET  services/admin/token_requests.php       -> daftar permintaan + ringkasan
//   POST services/admin/token_request_action.php -> approve / reject
//   GET  services/admin/token_transactions.php   -> ledger seluruh user
$page_title = 'Verifikasi Token - KSM Admin';
$extra_head = '
  <link rel="stylesheet" href="../styles/admin/explore_admin.css" />
  <link rel="stylesheet" href="../styles/admin/comments_admin.css?v=' . time() . '" />
  <link rel="stylesheet" href="../styles/admin/review_admin.css?v=' . time() . '" />
  <link rel="stylesheet" href="../styles/admin/token_admin.css?v=' . time() . '" />';
include 'components/header.php';
include 'components/sidebar.php';
?>

<div class="admin-review-page">

  <div class="page-header">
    <h1>
      <i data-feather="credit-card"></i>
      Verifikasi Token
    </h1>
    <p>Setujui atau tolak permintaan top-up token, dan pantau seluruh mutasi token pengguna.</p>
  </div>

  <!-- Ringkasan -->
  <div class="token-stat-grid">
    <div class="token-stat-card">
      <span class="token-stat-label">Menunggu Verifikasi</span>
      <strong class="token-stat-value" id="statPending">-</strong>
    </div>
    <div class="token-stat-card">
      <span class="token-stat-label">Token Disetujui</span>
      <strong class="token-stat-value" id="statApprovedTokens">-</strong>
    </div>
    <div class="token-stat-card">
      <span class="token-stat-label">Nilai Disetujui</span>
      <strong class="token-stat-value" id="statApprovedRupiah">-</strong>
    </div>
    <div class="token-stat-card">
      <span class="token-stat-label">Saldo Beredar</span>
      <strong class="token-stat-value" id="statCirculating">-</strong>
    </div>
  </div>

  <!-- Sub-tab: permintaan vs riwayat ledger -->
  <div class="token-view-switch" role="tablist" aria-label="Tampilan token">
    <button type="button" class="token-view-btn active" data-view="requests" role="tab" aria-selected="true">
      <i data-feather="inbox"></i> Permintaan Top-up
    </button>
    <button type="button" class="token-view-btn" data-view="transactions" role="tab" aria-selected="false">
      <i data-feather="list"></i> Riwayat Transaksi
    </button>
  </div>

  <!-- ===== VIEW: PERMINTAAN ===== -->
  <section id="viewRequests">
    <div class="review-tabs" role="tablist" aria-label="Filter status permintaan">
      <button type="button" class="review-tab active" data-status="pending" role="tab" aria-selected="true">
        Menunggu <span class="review-tab-count" id="countPending"></span>
      </button>
      <button type="button" class="review-tab" data-status="awaiting_proof" role="tab" aria-selected="false">
        Belum Ada Bukti <span class="review-tab-count" id="countAwaiting"></span>
      </button>
      <button type="button" class="review-tab" data-status="approved" role="tab" aria-selected="false">
        Disetujui <span class="review-tab-count" id="countApproved"></span>
      </button>
      <button type="button" class="review-tab" data-status="rejected" role="tab" aria-selected="false">
        Ditolak <span class="review-tab-count" id="countRejected"></span>
      </button>
      <button type="button" class="review-tab" data-status="" role="tab" aria-selected="false">
        Semua
      </button>
    </div>

    <div class="review-toolbar">
      <span class="review-total" id="tokenTotal"></span>
      <button type="button" class="btn-refresh" id="tokenRefresh" title="Muat ulang">
        <i data-feather="refresh-cw"></i>
      </button>
    </div>

    <div class="review-table-wrapper">
      <table class="review-table" id="tokenTable">
        <thead>
          <tr>
            <th scope="col">User &amp; Order ID</th>
            <th scope="col">Midtrans Tx ID</th>
            <th scope="col">Paket / Nominal</th>
            <th scope="col">MDR &amp; Bersih</th>
            <th scope="col">Status</th>
            <th scope="col">Tanggal</th>
            <th scope="col" class="col-actions">Aksi &amp; Sync</th>
          </tr>
        </thead>
        <tbody id="tokenTableBody">
          <tr>
            <td colspan="7" class="review-empty-cell">
              <div class="loader" style="margin:0 auto 12px;"></div>
              Memuat permintaan token...
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="tokenPagination" class="review-pagination"></div>
  </section>

  <!-- ===== VIEW: RIWAYAT TRANSAKSI ===== -->
  <section id="viewTransactions" hidden>
    <div class="review-tabs" role="tablist" aria-label="Filter tipe transaksi">
      <button type="button" class="review-tab txn-tab active" data-type="" role="tab" aria-selected="true">Semua</button>
      <button type="button" class="review-tab txn-tab" data-type="purchase" role="tab" aria-selected="false">Pembelian</button>
      <button type="button" class="review-tab txn-tab" data-type="upload" role="tab" aria-selected="false">Upload</button>
      <button type="button" class="review-tab txn-tab" data-type="refund" role="tab" aria-selected="false">Refund</button>
      <button type="button" class="review-tab txn-tab" data-type="adjustment" role="tab" aria-selected="false">Penyesuaian</button>
    </div>

    <div class="review-toolbar">
      <span class="review-total" id="txnTotal"></span>
      <button type="button" class="btn-refresh" id="txnRefresh" title="Muat ulang">
        <i data-feather="refresh-cw"></i>
      </button>
    </div>

    <div class="review-table-wrapper">
      <table class="review-table" id="txnTable">
        <thead>
          <tr>
            <th scope="col">Pengguna</th>
            <th scope="col">Tipe</th>
            <th scope="col">Jumlah</th>
            <th scope="col">Saldo Akhir</th>
            <th scope="col">Keterangan</th>
            <th scope="col">Tanggal</th>
          </tr>
        </thead>
        <tbody id="txnTableBody">
          <tr>
            <td colspan="6" class="review-empty-cell">
              <div class="loader" style="margin:0 auto 12px;"></div>
              Memuat riwayat transaksi...
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="txnPagination" class="review-pagination"></div>
  </section>
</div>

<!-- Modal detail & keputusan -->
<div class="review-modal" id="tokenModal" hidden>
  <div class="review-modal-backdrop" data-close-token-modal></div>
  <div class="review-modal-box" role="dialog" aria-modal="true" aria-labelledby="tokenModalTitle">
    <div class="review-modal-head">
      <h2 id="tokenModalTitle">Detail Permintaan Top-up</h2>
      <button type="button" class="review-modal-close" data-close-token-modal aria-label="Tutup">
        <i data-feather="x"></i>
      </button>
    </div>

    <div class="review-modal-body">
      <dl class="review-detail-list" id="tokenDetail"></dl>

      <div class="form-group" id="tokenReasonGroup">
        <label for="tokenReason">Alasan penolakan (opsional)</label>
        <textarea
          id="tokenReason"
          rows="3"
          maxlength="500"
          placeholder="Contoh: bukti transfer tidak terbaca..."></textarea>
        <small class="field-hint"><span id="tokenReasonCount">0</span>/500 karakter</small>
      </div>
    </div>

    <div class="review-modal-foot">
      <button type="button" class="btn-secondary" data-close-token-modal>Tutup</button>
      <button type="button" class="btn-danger-soft" id="tokenRejectBtn">
        <i data-feather="x-circle"></i> Tolak
      </button>
      <button type="button" class="btn-primary" id="tokenApproveBtn">
        <i data-feather="check-circle"></i> Setujui &amp; Tambah Token
      </button>
    </div>
  </div>
</div>

<?php
$extra_scripts = '
<script src="../js/token_requests_admin.js?v=' . time() . '"></script>
<script>
  if (typeof feather !== "undefined") feather.replace();
</script>';
include 'components/footer.php';
?>


