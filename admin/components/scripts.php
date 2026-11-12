<!-- Core Scripts FIRST -->
<script src="../js/api.js"></script>
<script src="../js/storage.js"></script>
<script src="../js/custom_alerts.js"></script>

<!-- Sesi admin: sudah divalidasi server-side oleh components/auth_guard.php.
     js/login.js (modal login lama) tidak dipakai lagi di panel admin. -->
<script>
  window.ADMIN_SESSION = <?php echo json_encode(
      $admin_session_user ?? ['role' => 'admin'],
      JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
  ); ?>;
</script>
<script src="../js/admin_session.js?v=20260731"></script>


<!-- UI Components -->
<script src="../js/mobile_menu.js?v=20260908"></script>
<!-- Sidebar admin: mode ciut (desktop) + drawer (mobile) -->
<script src="../js/admin_sidebar.js?v=20260908"></script>
<!-- Navbar admin: badge antrean + status tombol muat ulang -->
<script src="../js/admin_nav.js?v=20260908"></script>
<script src="../js/script.js"></script>

<!-- Initialization -->
<script>
  if (typeof feather !== 'undefined') {
    feather.replace();
  }
</script>
