<?php
/**
 * components/token_modal.php
 * Modal "Beli Token (Midtrans Payment Gateway)" + Modal "Token Tidak Cukup".
 * Include file ini di halaman manapun yang membutuhkan fitur beli token
 * (dashboard_user.php, my_journals_user.php, token_history_user.php, dst).
 *
 * Membutuhkan:
 *  - styles/user/token_wallet.css
 *  - js/token_wallet.js
 */
?>
<!-- ===== MODAL: BELI TOKEN (MIDTRANS GATEWAY) ===== -->
<div class="ksm-modal-overlay" id="ksmBuyTokenModal">
  <div class="ksm-modal-box ksm-modal-wide">
    <button type="button" class="ksm-modal-close" id="ksmBuyTokenClose" aria-label="Tutup">
      <i data-feather="x"></i>
    </button>

    <div class="ksm-modal-header-badge">
      <i data-feather="zap"></i> Top Up Saldo Instant
    </div>

    <h3 class="ksm-modal-title">Pilih Paket Token Upload</h3>
    <p class="ksm-modal-subtitle">
      Setiap 1 token digunakan untuk mengunggah 1 Jurnal atau Opini. Pembayaran dapat dilakukan secara otomatis via QRIS (GoPay, OVO, Dana, ShopeePay, Mobile Banking) & Transfer Bank.
    </p>

    <!-- Pricelist Package Cards -->
    <div class="ksm-token-packages-grid">

      <!-- 1 Token Trial -->
      <div class="ksm-pkg-card" data-pkg-id="pkg_1" data-tokens="1" data-price="5000">
        <span class="ksm-pkg-tag">Eceran</span>
        <div class="ksm-pkg-tokens">1 <span>Token</span></div>
        <div class="ksm-pkg-title">Paket Trial</div>
        <div class="ksm-pkg-price">Rp5.000</div>
        <div class="ksm-pkg-subtext">Rp5.000 / token</div>
      </div>

      <!-- 10 Token Starter -->
      <div class="ksm-pkg-card" data-pkg-id="pkg_10" data-tokens="10" data-price="30000">
        <span class="ksm-pkg-tag">Starter</span>
        <div class="ksm-pkg-tokens">10 <span>Token</span></div>
        <div class="ksm-pkg-title">Paket Starter</div>
        <div class="ksm-pkg-price">Rp30.000</div>
        <div class="ksm-pkg-subtext">Rp3.000 / token</div>
      </div>

      <!-- 20 Token Standar (Popular Default) -->
      <div class="ksm-pkg-card active popular" data-pkg-id="pkg_20" data-tokens="20" data-price="55000">
        <span class="ksm-pkg-tag popular-badge">⭐ Paling Populer</span>
        <div class="ksm-pkg-tokens">20 <span>Token</span></div>
        <div class="ksm-pkg-title">Paket Standar</div>
        <div class="ksm-pkg-price">Rp55.000</div>
        <div class="ksm-pkg-subtext">Rp2.750 / token (Hemat 8%)</div>
      </div>

      <!-- 35 Token Plus -->
      <div class="ksm-pkg-card" data-pkg-id="pkg_35" data-tokens="35" data-price="85000">
        <span class="ksm-pkg-tag">Best Value</span>
        <div class="ksm-pkg-tokens">35 <span>Token</span></div>
        <div class="ksm-pkg-title">Paket Plus</div>
        <div class="ksm-pkg-price">Rp85.000</div>
        <div class="ksm-pkg-subtext">Rp2.428 / token (Hemat 19%)</div>
      </div>

      <!-- 55 Token Pro -->
      <div class="ksm-pkg-card" data-pkg-id="pkg_55" data-tokens="55" data-price="120000">
        <span class="ksm-pkg-tag">Pro</span>
        <div class="ksm-pkg-tokens">55 <span>Token</span></div>
        <div class="ksm-pkg-title">Paket Pro</div>
        <div class="ksm-pkg-price">Rp120.000</div>
        <div class="ksm-pkg-subtext">Rp2.181 / token (Hemat 27%)</div>
      </div>

      <!-- 75 Token Sultan -->
      <div class="ksm-pkg-card" data-pkg-id="pkg_75" data-tokens="75" data-price="150000">
        <span class="ksm-pkg-tag">Sultan</span>
        <div class="ksm-pkg-tokens">75 <span>Token</span></div>
        <div class="ksm-pkg-title">Paket Sultan</div>
        <div class="ksm-pkg-price">Rp150.000</div>
        <div class="ksm-pkg-subtext">Rp2.000 / token (Hemat 33%)</div>
      </div>

    </div>

    <!-- Payment Summary Box -->
    <div class="ksm-token-summary-box">
      <div class="ksm-summary-row">
        <span>Paket Dipilih:</span>
        <strong id="ksmSelectedPkgName">Paket Standar (20 Token)</strong>
      </div>
      <div class="ksm-summary-row">
        <span>Total Pembayaran:</span>
        <strong id="ksmSelectedPkgPrice" class="price-highlight">Rp55.000</strong>
      </div>
      <div class="ksm-payment-methods-icons">
        <span class="method-badge">QRIS</span>
        <span class="method-badge">GoPay</span>
        <span class="method-badge">ShopeePay</span>
        <span class="method-badge">OVO / Dana</span>
        <span class="method-badge">BCA / Mandiri / BRI / BNI</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <button type="button" class="ksm-btn-midtrans-pay" id="ksmMidtransPayBtn">
      <i data-feather="qr-code"></i>
      Bayar Sekarang (QRIS / Midtrans)
    </button>

    <p class="ksm-token-note">
      🔒 Pembayaran aman diawasi oleh <strong>Midtrans Payment Gateway</strong>. Saldo token otomatis bertambah seketika setelah pembayaran berhasil dikonfirmasi.
    </p>
  </div>
</div>

<!-- ===== MODAL: TOKEN TIDAK CUKUP ===== -->
<div class="ksm-modal-overlay" id="ksmInsufficientTokenModal">
  <div class="ksm-modal-box ksm-center-text">
    <button type="button" class="ksm-modal-close" id="ksmInsufficientClose" aria-label="Tutup">
      <i data-feather="x"></i>
    </button>

    <div class="ksm-insufficient-icon">
      <i data-feather="alert-circle"></i>
    </div>

    <h3 class="ksm-modal-title" style="padding-right:0;">Token Tidak Cukup</h3>
    <p class="ksm-modal-subtitle">
      Anda membutuhkan minimal 1 token untuk mengunggah jurnal atau opini.
      Saldo token Anda saat ini adalah:
      <strong id="ksmInsufficientCurrentBalance">0</strong>.
    </p>

    <button type="button" class="ksm-btn-midtrans-pay" id="ksmGoBuyTokenBtn" data-ksm-open-buy-token>
      <i data-feather="shopping-cart"></i>
      Beli Token Sekarang
    </button>
  </div>
</div>