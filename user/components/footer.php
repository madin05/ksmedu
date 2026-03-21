<?php
// user/components/footer.php
?>
    <footer class="main-footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="footer-logo">
            <img src="../assets/main_logo.png" alt="Logo" />
          </div>
          <p>
            Platform edukasi dan informasi terpercaya untuk mendukung perkembangan akademik dan wawasan Anda.
          </p>
          <div class="social-links">
            <a href="#" class="social-icon"><i data-feather="instagram"></i></a>
            <a href="#" class="social-icon"><i data-feather="twitter"></i></a>
            <a href="#" class="social-icon"><i data-feather="facebook"></i></a>
            <a href="#" class="social-icon"><i data-feather="youtube"></i></a>
          </div>
        </div>

        <div class="footer-links">
          <h4>Quick Menu</h4>
          <ul>
            <li><a href="dashboard_user.php">Home</a></li>
            <li><a href="journals_user.php">Daftar Jurnal</a></li>
            <li><a href="opinions_user.php">Opini & Berita</a></li>
          </ul>
        </div>

        <div class="footer-contact">
          <h4>Hubungi Kami</h4>
          <div class="footer-contact-info">
            <div class="footer-contact-item">
              <i data-feather="mail"></i>
              <span>ksmedu2025@google.com</span>
            </div>
            <div class="footer-contact-item">
              <i data-feather="phone"></i>
              <span>+6281806361516</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2025 KSM Education. All rights reserved.</p>
        <div class="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
    
    <?php if (isset($extra_scripts)) echo $extra_scripts; ?>
  </body>
</html>
