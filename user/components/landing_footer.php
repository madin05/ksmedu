<?php
/**
 * user/components/landing_footer.php
 * Footer component for the landing page.
 */
$lang = $lang ?? 'id';
$t = $t ?? [];
$is_logged_in = $is_logged_in ?? false;
?>
<footer id="about" class="landing-footer">
    <div class="landing-footer-grid">
        <div class="footer-brand-col">
            <img src="assets/main_logo.png" alt="KSM Education Logo">
            <p><?php echo $t['footer_about_desc']; ?></p>
            <div class="footer-socials">
                <a href="#"><i data-feather="instagram"></i></a>
                <a href="#"><i data-feather="twitter"></i></a>
                <a href="#"><i data-feather="facebook"></i></a>
                <a href="#"><i data-feather="youtube"></i></a>
            </div>
        </div>

        <div class="footer-links-col">
            <h4><?php echo $t['footer_quick_menu']; ?></h4>
            <ul>
                <li><a href="#home"><?php echo $t['nav_home']; ?></a></li>
                <li><a href="user/journals_user.php"><?php echo $t['nav_journals']; ?></a></li>
                <li><a href="<?php echo $is_logged_in ? 'user/opinions_user.php' : 'user/login_user.php'; ?>"><?php echo $t['nav_articles']; ?></a></li>
                <li><a href="#guidelines"><?php echo $t['guidelines_title']; ?></a></li>
            </ul>
        </div>

        <div class="footer-contact-col">
            <h4><?php echo $t['footer_contact_us']; ?></h4>
            <div class="footer-contact-item">
                <i data-feather="mail"></i>
                <span>ksmedu2025@google.com</span>
            </div>
            <div class="footer-contact-item">
                <i data-feather="phone"></i>
                <span>+6285814991899</span>
            </div>
            <div class="footer-contact-item">
                <i data-feather="map-pin"></i>
                <span><?php echo $t['footer_contact_address']; ?></span>
            </div>
        </div>
    </div>

    <div class="landing-footer-bottom">
        <p>&copy; 2026 KSM Education. All rights reserved.</p>
        
        <!-- Secondary Language Selector in Footer -->
        <div class="landing-footer-bottom-links" style="display: flex; align-items: center; gap: 20px;">
            <div style="position: relative; display: inline-block;">
                <button class="lang-btn" id="langBtnFooter" style="color: rgba(255, 255, 255, 0.7); border-color: rgba(255, 255, 255, 0.2); background: transparent;">
                    🌐 <?php echo $lang === 'en' ? 'EN' : 'ID'; ?> 
                    <i data-feather="chevron-down" style="width: 14px; height: 14px; vertical-align: middle;"></i>
                </button>
                <div class="lang-dropdown" id="langDropdownFooter" style="bottom: 100%; top: auto; left: 0; right: auto; margin-bottom: 6px; margin-top: 0; min-width: 140px;">
                    <button class="lang-item" onclick="changeLanguage('id')">Bahasa (ID)</button>
                    <button class="lang-item" onclick="changeLanguage('en')">English (EN)</button>
                </div>
            </div>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
        </div>
    </div>
</footer>
