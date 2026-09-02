<?php
$page_title = 'Kontak - KSM Education';
$base_css = '<link rel="stylesheet" href="../styles/user/static_pages.css?v=20260902_v108" />' . "\n"
  . '    <link rel="stylesheet" href="../styles/user/profile_pages.css?v=20260824" />' . "\n"
  . '    <link rel="stylesheet" href="../styles/user/contact_user.css?v=20260902_v108" />';
include 'components/header.php';
include 'components/navbar.php';
?>

    <main class="container">
      <!-- Hero -->
      <section class="static-hero">
        <span class="static-hero-tag">Kontak</span>
        <h1>Ada Pertanyaan? Hubungi Kami</h1>
        <p>
          Tim KSM Education siap membantu seputar upload jurnal, opini,
          token, atau kerja sama lainnya.
        </p>
      </section>

      <div class="contact-layout">
        <!-- Info kontak -->
        <div class="contact-info-col">
          <div class="contact-info-card">
            <div class="contact-info-icon"><i data-feather="mail"></i></div>
            <div>
              <h4>Email</h4>
              <p>admin@ksmeducation.id</p>
            </div>
          </div>
          <div class="contact-info-card">
            <div class="contact-info-icon"><i data-feather="phone"></i></div>
            <div>
              <h4>WhatsApp</h4>
              <p>+62 856-9586-3173</p>
            </div>
          </div>
          <div class="contact-info-card">
            <div class="contact-info-icon"><i data-feather="map-pin"></i></div>
            <div>
              <h4>Alamat</h4>
              <p>Jl. Raya Puspiptek No. 46, Buaran, Kec. Pamulang, Kota Tangerang Selatan, Banten 15310</p>
            </div>
          </div>
          <div class="contact-info-card">
            <div class="contact-info-icon"><i data-feather="clock"></i></div>
            <div>
              <h4>Jam Operasional</h4>
              <p>Senin – Jumat, 09.00 – 17.00 WIB</p>
            </div>
          </div>

          <div class="contact-social">
            <a href="#" aria-label="Instagram"><i data-feather="instagram"></i></a>
            <a href="#" aria-label="Facebook"><i data-feather="facebook"></i></a>
            <a href="#" aria-label="Twitter"><i data-feather="twitter"></i></a>
            <a href="#" aria-label="YouTube"><i data-feather="youtube"></i></a>
          </div>
        </div>

        <!-- Form kontak -->
        <div class="contact-form-col">
          <div class="profile-card">
            <h3 class="profile-form-title">Kirim Pesan</h3>
            <form id="contactForm" class="profile-form">
              <!-- Honeypot anti-spam: wajib tetap ada (dicek di services/send_contact.php) -->
              <div aria-hidden="true" class="contact-honeypot" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">
                <label for="contactWebsite">Website</label>
                <input id="contactWebsite" name="website" type="text" tabindex="-1" autocomplete="off" />
              </div>
              <div class="form-group">
                <label for="contactNama">Nama</label>
                <input type="text" id="contactNama" name="name" placeholder="Nama lengkap" required />
              </div>

              <div class="form-group">
                <label for="contactEmail">Email</label>
                <input type="email" id="contactEmail" name="email" placeholder="email@contoh.com" required />
              </div>

              <div class="form-group">
                <label for="contactSubjek">Subjek</label>
                <input type="text" id="contactSubjek" name="subject" placeholder="Topik pesan Anda" required />
              </div>

              <div class="form-group">
                <label for="contactPesan">Pesan</label>
                <textarea id="contactPesan" name="message" rows="5" placeholder="Tulis pesan Anda di sini..." required></textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-save-profile">
                  <i data-feather="send"></i>
                  Kirim Pesan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>

<?php
$extra_scripts = <<<'EOT'
<script src="../js/script.js?v=2025112910"></script>
    <script src="../js/custom_alerts.js"></script>
    <script src="../js/kontak_user.js?v=20260824"></script>
    <script src="../js/mobile_menu.js?v=20251130"></script>
    <script>
      feather.replace();
    </script>
EOT;
include 'components/footer.php';
?>

