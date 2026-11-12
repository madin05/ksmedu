<?php

/**
 * KSM Education Landing Page
 * Premium hybrid educational portal landing page.
 * Refactored and modularized to avoid duplication and excessive file length.
 */

require_once __DIR__ . '/services/auth_context.php';
ksmedu_session_start(KSMEDU_CTX_USER);

// Jika user sudah login, arahkan ke dashboard internal
if (!empty($_SESSION['user_id'])) {
    header("Location: user/dashboard");
    exit();
}

// Load backend logic & translations untuk Landing Page Guest
require_once __DIR__ . '/services/landing_controller.php';
?>
<!DOCTYPE html>
<html lang="<?php echo $lang; ?>">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KSM Education — Publikasi Jurnal & Opini Ilmiah</title>
    <!-- Preconnect for fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="styles/base/fonts.css">
    <link rel="stylesheet" href="styles/user/landing.css?v=20260813mobile">
    <link rel="stylesheet" href="styles/user/ad_carousel.css?v=20260717">
    <link rel="shortcut icon" type="image/x-icon" href="assets/favicon.ico" />
    <script src="https://unpkg.com/feather-icons"></script>
</head>

<body id="home">

    <!-- Top Navigation Bar Component -->
    <?php require_once __DIR__ . '/user/components/landing_header.php'; ?>

    <!-- Hero Section -->
    <section class="landing-hero" aria-roledescription="carousel" aria-label="KSM Education featured content">
        <div class="landing-hero-slides">
            <div class="landing-hero-slide active" style="background-image: url('assets/slideshow-3.png');"></div>
        </div>

        <div class="hero-deco-1"></div>
        <div class="hero-deco-2"></div>

        <div class="landing-hero-content">
            <h1><?php echo $t['hero_title']; ?></h1>
            <p style="color: var(--text-muted); font-size: 18px; line-height: 1.6; max-width: 680px; margin: 0 auto;">
                <?php echo $t['hero_subtitle']; ?>
            </p>

            <!-- Search Bar Box with Dropdown filter beside it -->
            <div class="landing-search-container">
                <form id="searchForm" action="user/journals_user.php" method="GET" class="landing-search-box">
                    <div class="search-filter-custom" id="searchFilterCustom">
                        <button type="button" class="filter-trigger" id="filterTrigger">
                            <span id="filterCurrent"><?php echo $t['search_opt_journals']; ?></span>
                            <i data-feather="chevron-down" class="caret-icon"></i>
                        </button>
                        <ul class="filter-dropdown-menu" id="filterDropdownMenu">
                            <li data-value="journals" class="active"><?php echo $t['search_opt_journals']; ?></li>
                            <li data-value="articles"><?php echo $t['search_opt_articles']; ?></li>
                        </ul>
                        <input type="hidden" name="filter" id="searchFilter" value="journals">
                    </div>

                    <input type="text" name="search" placeholder="<?php echo $t['search_placeholder']; ?>" autocomplete="off">
                    <button type="submit" class="btn-search-submit"><?php echo $t['search_btn']; ?></button>
                </form>
            </div>

            <!-- CTA Buttons -->
            <div class="landing-hero-ctas">
                <a href="<?php echo $is_logged_in ? 'user/dashboard_user.php?action=upload' : 'user/login_user.php'; ?>" class="btn-hero-primary">
                    <i data-feather="upload"></i>
                    <?php echo $t['cta_upload']; ?>
                </a>
                <a href="<?php echo $is_logged_in ? 'user/opinions_user.php' : 'user/login_user.php'; ?>" class="btn-hero-secondary">
                    <?php echo $t['cta_news']; ?>
                </a>
            </div>

            <!-- Floating Glassmorphism Statistics Bar -->
            <div class="landing-stats-container">
                <div class="landing-stat-item">
                    <div class="landing-stat-icon-wrapper">
                        <i data-feather="file-text"></i>
                    </div>
                    <div class="landing-stat-info">
                        <span class="landing-stat-val"><?php echo number_format($base_journals_count); ?>+</span>
                        <span class="landing-stat-lbl"><?php echo $t['stat_journals']; ?></span>
                    </div>
                </div>

                <div class="landing-stat-item">
                    <div class="landing-stat-icon-wrapper">
                        <i data-feather="globe"></i>
                    </div>
                    <div class="landing-stat-info">
                        <span class="landing-stat-val"><?php echo number_format($base_news_count); ?>+</span>
                        <span class="landing-stat-lbl"><?php echo $t['stat_news']; ?></span>
                    </div>
                </div>

                <div class="landing-stat-item">
                    <div class="landing-stat-icon-wrapper">
                        <i data-feather="users"></i>
                    </div>
                    <div class="landing-stat-info">
                        <span class="landing-stat-val"><?php echo number_format($base_readers_count); ?>+</span>
                        <span class="landing-stat-lbl"><?php echo $t['stat_readers']; ?></span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Split Content Area (The Core) -->
    <section class="landing-split-section">
        <div class="split-grid">

            <!-- Left Column: Latest Academic Journals (Text Heavy, Formal) -->
            <div class="split-left-column">
                <div class="column-header">
                    <h2>
                        <i data-feather="file-text"></i>
                        <?php echo $t['title_journals']; ?>
                    </h2>
                    <a href="user/login_user.php" class="btn-view-all">
                        <?php echo $t['btn_view_all']; ?>
                        <i data-feather="arrow-right" style="width: 14px; height: 14px;"></i>
                    </a>
                </div>

                <div class="academic-cards-container">
                    <?php if (empty($rendered_journals)): ?>
                        <div class="landing-empty-state" style="padding: 40px 24px; text-align: center; background: var(--bg-slate); border: 1px dashed var(--border-color); border-radius: 12px; color: var(--text-muted); font-size: 14px; font-weight: 500; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                            <i data-feather="inbox" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                            <p style="margin: 0;"><?php echo $lang === 'en' ? 'No academic journals published yet.' : 'Belum ada jurnal akademik terpublikasi.'; ?></p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($rendered_journals as $journal): ?>
                            <?php
                            $journal_link = ($journal['id'] === '#') ? 'user/journals_user.php' : 'user/explore_jurnal_user.php?id=' . $journal['id'] . '&type=jurnal';
                            ?>
                            <a href="<?php echo $journal_link; ?>" class="academic-card">
                                <div class="academic-thumbnail">
                                    <img src="<?php echo htmlspecialchars($journal['cover']); ?>" alt="Cover Jurnal">
                                </div>
                                <div class="academic-content">
                                    <h3 class="academic-title"><?php echo htmlspecialchars($journal['title']); ?></h3>
                                    <div class="academic-authors">
                                        <?php echo htmlspecialchars($journal['authors']); ?>
                                    </div>
                                    <div class="academic-meta">
                                        <span>
                                            <i data-feather="calendar"></i>
                                            <?php echo htmlspecialchars($journal['date']); ?>
                                        </span>
                                        <span>
                                            <i data-feather="eye"></i>
                                            <?php echo number_format($journal['views']); ?> <?php echo $t['views_count']; ?>
                                        </span>
                                    </div>
                                </div>
                            </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Right Column: Featured News & Articles (Visual Heavy, Engaging) -->
            <div class="split-right-column">
                <div class="column-header">
                    <h2>
                        <i data-feather="image"></i>
                        <?php echo $t['title_news']; ?>
                    </h2>
                    <a href="<?php echo $is_logged_in ? 'user/opinions_user.php' : 'user/login_user.php'; ?>" class="btn-view-all">
                        <?php echo $t['btn_view_all']; ?>
                        <i data-feather="arrow-right" style="width: 14px; height: 14px;"></i>
                    </a>
                </div>

                <div class="news-cards-container">
                    <?php if (empty($rendered_opinions)): ?>
                        <div class="landing-empty-state" style="padding: 40px 24px; text-align: center; background: var(--bg-slate); border: 1px dashed var(--border-color); border-radius: 12px; color: var(--text-muted); font-size: 14px; font-weight: 500; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; width: 100%;">
                            <i data-feather="inbox" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                            <p style="margin: 0;"><?php echo $lang === 'en' ? 'No news or opinions published yet.' : 'Belum ada opini atau berita terpublikasi.'; ?></p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($rendered_opinions as $opinion): ?>
                            <?php
                            $opinion_link = ($opinion['id'] === '#') ? 'user/opinions_user.php' : 'user/explore_opini_user.php?id=' . $opinion['id'] . '&type=opini';
                            ?>
                            <a href="<?php echo $opinion_link; ?>" class="news-card">
                                <div class="news-thumbnail">
                                    <img src="<?php echo htmlspecialchars($opinion['cover']); ?>" alt="Thumbnail News">
                                </div>
                                <div class="news-content">
                                    <h3 class="news-title"><?php echo htmlspecialchars($opinion['title']); ?></h3>
                                    <p class="news-summary"><?php echo htmlspecialchars($opinion['summary']); ?></p>
                                    <div class="news-meta">
                                        <span>
                                            <i data-feather="calendar" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i>
                                            <?php echo htmlspecialchars($opinion['date']); ?>
                                        </span>
                                        <span class="news-readtime">
                                            <?php echo $opinion['read_time']; ?> <?php echo $t['read_time']; ?>
                                        </span>
                                    </div>
                                </div>
                            </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </section>

    <!-- Author Guidelines Component -->
    <?php require_once __DIR__ . '/user/components/landing_guidelines.php'; ?>

    <!-- Submission CTA Section -->
    <section class="landing-submission">
        <div class="landing-submission-banner">
            <div class="submission-deco"></div>
            <div class="landing-submission-content">
                <h2><?php echo $t['submit_title']; ?></h2>
                <p><?php echo $t['submit_desc']; ?></p>
                <a href="<?php echo $is_logged_in ? 'user/dashboard_user.php?action=upload' : 'user/login_user.php'; ?>" class="btn-submission-upload">
                    <i data-feather="upload-cloud"></i>
                    <?php echo $t['submit_btn']; ?>
                </a>
            </div>
        </div>
    </section>

    <!-- Footer Component -->
    <?php require_once __DIR__ . '/user/components/landing_footer.php'; ?>

    <!-- Interactive Scripts -->
    <script src="js/landing.js?v=202607161225"></script>
    <script src="js/ad_carousel.js?v=20260717"></script>
    <script>
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    </script>
</body>

</html>