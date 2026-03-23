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
      <a href="opinions.php" id="breadcrumbType">Opini</a>
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
          <span id="articleBadge" class="article-badge badge-opini">
            <i data-feather="book-open"></i>
            <span id="badgeText">Artikel Opini</span>
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
          <div
            class="content-section"
            id="pengurusSection"
            style="display: none"
          >
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
                <a
                  href="#"
                  id="pdfDownload"
                  class="btn-pdf btn-download"
                  download
                >
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

    <!-- Comments Section -->
    <section id="comments-section" style="max-width:900px;margin:0 auto;padding:0 24px;"></section>

    
<?php
$extra_scripts = <<<'EOT'
<script src="../js/pdf_text_extractor.js"></script>
<script src="../js/explore_jurnal_user.js"></script>
<script src="../js/comments.js"></script>
<script>
  if (typeof feather !== 'undefined') feather.replace();
  (function() {
    const params = new URLSearchParams(window.location.search);
    const articleId = parseInt(params.get('id') || 0);
    const articleType = params.get('type') || 'opini';
    if (articleId && typeof window.initComments === 'function') {
      window.initComments(articleId, articleType);
    }
  })();
</script>
EOT;
include 'components/footer.php';
?>
