<?php
// admin/components/sidebar.php
?>
    <header>
      <div class="header-container">
        <div class="logo">
          <a href="dashboard_admin.php"><img src="../assets/main_logo.png" alt="Logo" /></a>
        </div>

        <button
          class="hamburger-menu"
          aria-label="Toggle menu"
          aria-expanded="false"
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav>
          <a href="dashboard_admin.php">HOME</a>
          <div class="nav-dropdown">
            <button class="nav-link has-caret" type="button">
              ARTIKEL
              <svg
                class="caret"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="dropdown-menu">
              <a href="journals.php">Artikel Jurnal</a>
              <a href="opinions.php">Artikel Opini</a>
              <a href="journals.php#search">Cari Artikel</a>
            </div>
          </div>
          <a href="dashboard_admin.php#upload">UPLOAD</a>
          <a href="comments.php">KOMENTAR</a>
        </nav>

        <?php 
        $current_page = basename($_SERVER['PHP_SELF']);
        if ($current_page === 'dashboard_admin.php'): 
        ?>
        <div class="navbar-search-container">
          <input type="checkbox" class="navbar-search-checkbox" id="navbarSearchToggle" checked>
          <div class="navbar-search-mainbox">
              <div class="navbar-search-icon-container">
                  <svg viewBox="0 0 512 512" height="1em" xmlns="http://www.w3.org/2000/svg" class="navbar-search-icon"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"></path></svg>
              </div>
              <input type="text" class="navbar-search-input" id="navbarSearchInput" placeholder="Cari artikel..." autocomplete="off">
          </div>
        </div>
        <?php endif; ?>

        <div class="auth-section">
          <button class="btn-register">LOGIN</button>
        </div>
      </div>
    </header>
<?php include 'login_modal.php'; ?>
