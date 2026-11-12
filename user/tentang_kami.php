<?php
$page_title = 'Tentang Kami - KSM Education';
$base_css = '<link rel="stylesheet" href="../styles/user/tentang_kami.css?v=20260905" />';
include 'components/header.php';
include 'components/navbar.php';
?>

<div class="tentang-container">
    <section class="tentang-hero">
        <div class="tentang-hero-content">
            <h1>Tentang KSM Education</h1>
            <p class="tentang-subtitle">Platform Publikasi Jurnal & Artikel Ilmiah Terpercaya</p>
        </div>
    </section>

    <section class="tentang-content">
        <div class="tentang-section">
            <div class="tentang-icon">
                <i data-feather="book-open"></i>
            </div>
            <h2>Siapa Kami</h2>
            <p>KSM Education adalah platform digital yang menyediakan layanan publikasi dan penyimpanan artikel ilmiah, jurnal penelitian, serta opini edukatif. Kami berkomitmen untuk mendukung perkembangan ilmu pengetahuan dengan menyediakan akses terbuka terhadap hasil riset berkualitas tinggi dari berbagai bidang keilmuan.</p>
        </div>

        <div class="tentang-section">
            <div class="tentang-icon">
                <i data-feather="target"></i>
            </div>
            <h2>Visi Kami</h2>
            <p>Menjadi platform publikasi ilmiah terdepan yang memfasilitasi penyebaran pengetahuan dan inovasi riset secara global, serta mempercepat kolaborasi antar akademisi, peneliti, dan praktisi di seluruh dunia.</p>
        </div>

        <div class="tentang-section">
            <div class="tentang-icon">
                <i data-feather="award"></i>
            </div>
            <h2>Misi Kami</h2>
            <ul class="tentang-list">
                <li>Menyediakan platform publikasi yang mudah diakses dan terpercaya bagi para peneliti dan akademisi</li>
                <li>Memfasilitasi proses review dan publikasi artikel ilmiah secara transparan dan efisien</li>
                <li>Mendukung pengembangan ilmu pengetahuan melalui akses terbuka terhadap jurnal dan artikel berkualitas</li>
                <li>Membangun ekosistem akademik yang kolaboratif dan inklusif</li>
                <li>Meningkatkan visibilitas dan dampak penelitian Indonesia di kancah internasional</li>
            </ul>
        </div>

        <div class="tentang-section">
            <div class="tentang-icon">
                <i data-feather="layers"></i>
            </div>
            <h2>Layanan Kami</h2>
            <div class="tentang-services">
                <div class="service-card">
                    <i data-feather="upload-cloud"></i>
                    <h3>Upload Jurnal</h3>
                    <p>Publikasikan hasil penelitian Anda dengan mudah melalui sistem upload berbasis token yang transparan dan aman</p>
                </div>
                <div class="service-card">
                    <i data-feather="database"></i>
                    <h3>Database Artikel</h3>
                    <p>Akses ribuan jurnal dan artikel ilmiah dari berbagai bidang keilmuan yang tersimpan dalam database terstruktur</p>
                </div>
                <div class="service-card">
                    <i data-feather="edit-3"></i>
                    <h3>Opini & Berita</h3>
                    <p>Bagikan pemikiran dan perspektif edukatif melalui artikel opini dan berita terkini seputar perkembangan ilmu pengetahuan</p>
                </div>
                <div class="service-card">
                    <i data-feather="users"></i>
                    <h3>Komunitas Akademik</h3>
                    <p>Terhubung dengan peneliti dan akademisi lainnya dalam ekosistem ilmiah yang kolaboratif dan suportif</p>
                </div>
            </div>
        </div>

        <div class="tentang-section">
            <div class="tentang-icon">
                <i data-feather="shield"></i>
            </div>
            <h2>Komitmen Kualitas</h2>
            <p>Setiap jurnal yang dipublikasikan di KSM Education melalui proses verifikasi dan peninjauan administratif untuk memastikan kualitas dan kesesuaian dengan standar akademik. Kami menjaga integritas publikasi ilmiah dengan menerapkan prinsip transparansi, objektivitas, dan akuntabilitas dalam setiap tahapan publikasi.</p>
        </div>

        <div class="tentang-cta">
            <h2>Bergabunglah Bersama Kami</h2>
            <p>Mulai publikasikan hasil penelitian Anda dan raih pembaca dari jejaring akademisi global</p>
            <div class="tentang-cta-buttons">
                <a href="register_user.php" class="btn-primary">Daftar Sekarang</a>
                <a href="dashboard_user.php" class="btn-secondary">Lihat Dashboard</a>
            </div>
        </div>
    </section>
</div>

<?php
$extra_scripts = <<<'EOT'
<script src="../js/script.js"></script>
<script src="../js/mobile_menu.js"></script>
<script>
  feather.replace();
</script>
EOT;
include 'components/footer.php';
?>
