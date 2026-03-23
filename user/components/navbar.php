<?php
// user/components/navbar.php
?>
    <header>
      <div class="header-container">
        <div class="logo">
          <a href="dashboard_user.php"><img src="../assets/main_logo.png" alt="Logo" /></a>
        </div>

        <button class="hamburger-menu" aria-label="Toggle menu" aria-expanded="false" type="button">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav>
          <a href="dashboard_user.php">HOME</a>
          <div class="nav-dropdown">
            <button class="nav-link has-caret" type="button">
              ARTIKEL
              <svg
                class="caret"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="dropdown-menu">
              <button type="button" class="dropdown-close" aria-label="Close dropdown">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <a href="journals_user.php">Jurnal</a>
              <a href="opinions_user.php">Opini & Berita</a>
            </div>
          </div>
        </nav>

        <div class="auth-section" id="navbarAuth">
          <!-- Dynamically populated by script.js -->
        </div>
      </div>
    </header>
