<?php
/**
 * user/components/landing_header.php
 * Header component for the landing page.
 */
$lang = $lang ?? 'id';
$t = $t ?? [];
$is_logged_in = $is_logged_in ?? false;
$user_avatar_char = $user_avatar_char ?? '';
$user_name = $user_name ?? '';
?>
<header class="landing-header">
    <div class="landing-nav-container">
        <a href="index.php?lang=<?php echo $lang; ?>" class="landing-logo">
            <img src="assets/main_logo.png" alt="KSM Education Logo">
        </a>
        
        <nav class="landing-nav-links" id="landingNavMenu">
            <a href=""><?php echo $t['nav_home']; ?></a>
            <a href="user/journals_user.php"><?php echo $t['nav_journals']; ?></a>
            <a href="<?php echo $is_logged_in ? 'user/opinions_user.php' : 'user/login_user.php'; ?>"><?php echo $t['nav_articles']; ?></a>
            <a href="user/tentang_kami.php"><?php echo $t['nav_about']; ?></a>

            <div class="landing-mobile-nav-footer">
                <?php if (!$is_logged_in): ?>
                    <div class="landing-nav-auth">
                        <a href="user/login_user.php" class="btn-signin"><?php echo $lang === 'en' ? 'Sign In' : 'Masuk'; ?></a>
                        <a href="user/register_user.php" class="btn-register"><?php echo $lang === 'en' ? 'Register' : 'Daftar'; ?></a>
                    </div>
                <?php endif; ?>
            </div>
        </nav>

        <div class="landing-nav-right">
            <!-- Sleek Language Switcher -->
            <div class="lang-switcher">
                <button class="lang-btn" id="langBtnDesktop">
                    🌐 <?php echo $lang === 'en' ? 'EN' : 'ID'; ?> 
                    <i data-feather="chevron-down" style="width: 14px; height: 14px;"></i>
                </button>
                <div class="lang-dropdown" id="langDropdownDesktop">
                    <button class="lang-item" onclick="changeLanguage('id')">Bahasa (ID)</button>
                    <button class="lang-item" onclick="changeLanguage('en')">English (EN)</button>
                </div>
            </div>

            <div class="landing-nav-auth">
                <?php if ($is_logged_in): ?>
                    <a href="user/dashboard_user.php" class="landing-nav-user">
                        <div class="avatar"><?php echo $user_avatar_char; ?></div>
                        <span class="name"><?php echo htmlspecialchars($user_name); ?></span>
                    </a>
                <?php else: ?>
                    <a href="user/login_user.php" class="btn-signin"><?php echo $lang === 'en' ? 'Sign In' : 'Masuk'; ?></a>
                    <a href="user/register_user.php" class="btn-register"><?php echo $lang === 'en' ? 'Register' : 'Daftar'; ?></a>
                <?php endif; ?>
            </div>
        </div>

        <!-- Mobile Actions: Tombol Daftar di sebelah kiri Hamburger Button -->
        <div class="landing-mobile-actions">
            <?php if ($is_logged_in): ?>
                <a href="user/dashboard_user.php" class="btn-mobile-nav-user" title="<?php echo htmlspecialchars($user_name); ?>">
                    <div class="avatar"><?php echo $user_avatar_char; ?></div>
                </a>
            <?php else: ?>
                <a href="user/register_user.php" class="btn-mobile-register">
                    <?php echo $lang === 'en' ? 'Register' : 'Daftar'; ?>
                </a>
            <?php endif; ?>

            <button class="landing-mobile-menu-btn" id="mobileMenuBtn" aria-label="Menu" aria-expanded="false">
                <i data-feather="menu"></i>
            </button>
        </div>
    </div>
</header>
