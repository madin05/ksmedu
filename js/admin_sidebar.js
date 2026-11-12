// ===== ADMIN SIDEBAR (collapsible + drawer mobile) =====
// Dipakai di semua halaman admin (dimuat dari admin/components/scripts.php).
//
// - Desktop (>1024px): tombol #sidebarCollapse menciutkan sidebar jadi ikon
//   saja (body.sidebar-collapsed), preferensi disimpan di localStorage.
// - Mobile (<=1024px): sidebar menjadi drawer; .hamburger-menu di topbar
//   membuka/menutupnya bersama #adminOverlay.
// - mobile_menu.js sengaja dilewati untuk halaman admin (lihat guard di
//   file tersebut) agar tidak terjadi toggle ganda.

(() => {
  "use strict";

  const STORAGE_KEY = "ksm_admin_sidebar";
  const MOBILE_BP = 1024;

  const isMobileView = () => window.innerWidth <= MOBILE_BP;

  function openDrawer(sidebar, overlay, hamburger) {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.classList.add("menu-open");
    if (hamburger) hamburger.setAttribute("aria-expanded", "true");
  }

  function closeDrawer(sidebar, overlay, hamburger) {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");
    if (hamburger) hamburger.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("adminSidebar");
    if (!sidebar) return;
    const overlay = document.getElementById("adminOverlay");
    const collapseBtn = document.getElementById("sidebarCollapse");
    const hamburger = document.querySelector(".admin-topbar .hamburger-menu");

    // Kembalikan preferensi mode ciut (hanya relevan di desktop).
    try {
      if (localStorage.getItem(STORAGE_KEY) === "collapsed" && !isMobileView()) {
        document.body.classList.add("sidebar-collapsed");
        if (collapseBtn) collapseBtn.setAttribute("aria-expanded", "false");
      }
    } catch (err) {
      console.debug("Sidebar pref tidak terbaca:", err);
    }

    if (collapseBtn) {
      collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const collapsed = document.body.classList.toggle("sidebar-collapsed");
        collapseBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
        try {
          localStorage.setItem(STORAGE_KEY, collapsed ? "collapsed" : "expanded");
        } catch (err) {
          console.debug("Sidebar pref tidak tersimpan:", err);
        }
      });
    }

    if (hamburger) {
      hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = sidebar.classList.contains("open");
        if (isOpen) {
          closeDrawer(sidebar, overlay, hamburger);
          hamburger.classList.remove("active");
        } else {
          openDrawer(sidebar, overlay, hamburger);
          hamburger.classList.add("active");
        }
      });
    }

    if (overlay) {
      overlay.addEventListener("click", () => {
        closeDrawer(sidebar, overlay, hamburger);
        if (hamburger) hamburger.classList.remove("active");
      });
    }

    // Klik menu di mobile langsung menutup drawer.
    sidebar.querySelectorAll(".side-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (isMobileView()) {
          closeDrawer(sidebar, overlay, hamburger);
          if (hamburger) hamburger.classList.remove("active");
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("open")) {
        closeDrawer(sidebar, overlay, hamburger);
        if (hamburger) hamburger.classList.remove("active");
      }
    });

    // Kembali ke desktop: pastikan drawer tertutup.
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isMobileView()) {
          closeDrawer(sidebar, overlay, hamburger);
          if (hamburger) hamburger.classList.remove("active");
        }
      }, 200);
    });

    // Biarkan helper global mobile (mis. login.js) bisa menutup drawer admin.
    window.closeMobileMenu = () => {
      closeDrawer(sidebar, overlay, hamburger);
      if (hamburger) hamburger.classList.remove("active");
    };
  });
})();
