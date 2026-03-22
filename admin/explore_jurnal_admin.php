<?php
$page_title = 'Detail Artikel - KSM Education';
$extra_head = '<link rel="stylesheet" href="../styles/explore_admin.css" />';
include 'components/header.php';
include 'components/sidebar.php';
?>

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <a href="dashboard_admin.php">Home</a>
      <span>/</span>
      <a href="journals.php" id="breadcrumbType">Jurnal</a>
      <span>/</span>
      <span id="breadcrumbTitle">Blog</span>
    </div>

    <!-- Search Modal -->
    <div id="searchModal" class="search-modal" style="display: none">
      <div class="search-modal-content">
        <div class="search-modal-header">
          <h3>Hasil Pencarian</h3>
          <button id="closeSearchModal" class="close-btn">
            <i data-feather="x"></i>
          </button>
        </div>
        <div id="searchResults" class="search-results"></div>
      </div>
    </div>

    <!-- Main Container -->
    <div class="container">
      <!-- Loading State -->
      <div id="loadingState" class="loading">
        <div class="loading-spinner"></div>
        <p>Memuat artikel...</p>
      </div>

      <!-- Error State -->
      <div id="errorState" class="error-message" style="display: none">
        <i data-feather="alert-circle"></i>
        <h3>Artikel tidak ditemukan</h3>
        <p>Artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
      </div>

      <!-- Article Detail -->
      <div id="articleDetail" class="article-card" style="display: none">
        <div class="article-header">
          <span id="articleBadge" class="article-badge badge-jurnal">
            <i data-feather="book-open"></i>
            <span id="badgeText">Artikel Jurnal</span>
          </span>

          <h1 class="article-title" id="articleTitle">-</h1>

          <div class="article-meta">
            <div class="meta-item">
              <i data-feather="user"></i>
              <span id="articleAuthor">admin</span>
            </div>
            <div class="meta-item">
              <i data-feather="calendar"></i>
              <span id="articleDate">-</span>
            </div>
            <div class="meta-item">
              <i data-feather="eye"></i>
              <span id="articleViews">0</span>
            </div>
            <div class="meta-item">
              <i data-feather="clock"></i>
              <span id="readTime">5 min read</span>
            </div>
          </div>
        </div>

        <img id="articleCover" class="article-cover" style="display: none" />

        <div class="article-content">
          <!-- Abstract -->
          <div class="content-section">
            <h2 class="section-title">
              <i data-feather="file-text"></i>
              <span id="abstractTitle">Abstrak</span>
            </h2>
            <div class="abstract-box">
              <p id="articleAbstract">-</p>
            </div>
          </div>

          <!-- Volume -->
          <div class="content-section" id="volumeSection" style="display: none">
            <h2 class="section-title">
              <i data-feather="book-open"></i>
              Volume
            </h2>
            <div class="contact-grid">
              <div class="contact-item">
                <i data-feather="book"></i>
                <span id="articleVolume">-</span>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div class="content-section" id="tagsSection" style="display: none">
            <h2 class="section-title">
              <i data-feather="tag"></i>
              Kata Kunci
            </h2>
            <div class="tags-container" id="articleTags"></div>
          </div>

          <!-- Authors -->
          <div class="content-section">
            <h2 class="section-title">
              <i data-feather="users"></i>
              Penulis
            </h2>
            <div class="authors-grid" id="articleAuthors"></div>
          </div>

          <!-- Pengurus -->
          <div class="content-section" id="pengurusSection" style="display: none">
            <h2 class="section-title">
              <i data-feather="briefcase"></i>
              Pengurus
            </h2>
            <div class="authors-grid" id="articlePengurus"></div>
          </div>

          <!-- Contact -->
          <div class="content-section">
            <h2 class="section-title">
              <i data-feather="phone"></i>
              Informasi Kontak
            </h2>
            <div class="contact-grid">
              <div class="contact-item">
                <i data-feather="mail"></i>
                <a href="#" id="articleEmail">-</a>
              </div>
              <div class="contact-item">
                <i data-feather="phone"></i>
                <span id="articlePhone">-</span>
              </div>
            </div>
          </div>

          <!-- PDF Section -->
          <div class="content-section" id="pdfSection">
            <div class="pdf-section">
              <h3>
                <i data-feather="file"></i>
                Dokumen Lengkap
              </h3>
              <p>Lihat dan download dokumen lengkap dalam format PDF</p>

              <div class="pdf-actions">
                <a href="#" id="pdfDownload" class="btn-pdf btn-download" download>
                  <i data-feather="download"></i>
                  Download PDF
                </a>
              </div>

              <div class="pdf-viewer" id="pdfViewer" style="display: block">
                <iframe id="pdfIframe"></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="modal">
      <div class="modal-overlay"></div>
      <div class="modal-content login-container">
        <button type="button" class="close-modal" id="closeLoginModal">
          <i data-feather="x"></i>
        </button>
        <div class="login-header">
          <img src="../assets/main_logo.png" alt="KSM Education Logo" class="login-logo" />
          <h2>ADMIN LOGIN</h2>
          <p style="color: #666; font-size: 14px; margin-top: 8px">Login sebagai Administrator</p>
        </div>
        <form id="loginForm" class="login-form">
          <div class="form-group">
            <input type="email" id="loginEmail" placeholder="Masukan Email Admin" required />
          </div>
          <div class="form-group password-group">
            <input type="password" id="loginPassword" placeholder="Masukan Password" required />
            <button type="button" class="toggle-password" id="togglePassword">
              <i data-feather="eye" id="eyeIcon"></i>
            </button>
          </div>
          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" id="rememberMe" />
              <span>Remember Me</span>
            </label>
            <a href="#" class="forgot-password">Forgot Password?</a>
          </div>
          <button type="submit" class="btn-login">MASUK</button>
        </form>
      </div>
    </div>

    
<?php
$extra_scripts = <<<'EOT'
<script src="../js/pdf_text_extractor.js"></script>
    <script src="../js/explore_jurnal_user.js"></script>
    <script src="../js/mobile_menu.js"></script>
    <script src="../js/opinions_manager.js"></script>
    <script src="../js/login.js"></script>
    <script src="../js/custom_alerts.js"></script>
    <script src="../js/script.js"></script>
    <script src="../js/api.js"></script>
    <script src="../js/storage.js"></script>
  
EOT;
include 'components/footer.php';
?>
