/**
 * MOBILE_MENU.JS
 * Mobile Menu & Responsive Functionality for Dashboard User
 * KSM EDUCATION
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing mobile menu...");

  // Halaman admin memakai sidebar sendiri (js/admin_sidebar.js). Di sini
  // hanya efek glassmorphism topbar agar tidak terjadi toggle ganda.
  if (document.getElementById("adminSidebar")) {
    const topbar = document.querySelector(".admin-topbar");
    if (topbar) {
      const handleTopbarScroll = () => {
        topbar.classList.toggle("scrolled", window.scrollY > 15);
      };
      window.addEventListener("scroll", handleTopbarScroll);
      handleTopbarScroll();
    }
    return;
  }

  // Get elements
  const header = document.querySelector(".header-container");
  const nav = document.querySelector("nav");
  const hamburger = document.querySelector(".hamburger-menu");

  if (!header || !nav || !hamburger) {
    console.error("Required elements not found");
    return;
  }

  // Clone logo into nav for mobile side menu (at the top)
  const logoEl = document.querySelector(".logo");
  if (logoEl && !nav.querySelector(":scope > .nav-logo")) {
    const navLogo = document.createElement("div");
    navLogo.className = "nav-logo";
    navLogo.innerHTML = logoEl.innerHTML;
    nav.insertBefore(navLogo, nav.firstChild);
  }

  // The auth section in the sidebar has been removed, as the icon in the mobile header is sufficient.

  // Create overlay for mobile menu
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  /**
   * Open mobile menu
   */
  function openMenu() {
    hamburger.classList.add("active");
    hamburger.setAttribute("aria-expanded", "true");
    nav.classList.add("active");
    overlay.classList.add("active");
    document.body.classList.add("menu-open");
  }

  /**
   * Close mobile menu
   */
  function closeMenu() {
    hamburger.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    nav.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");

    // Close any open dropdowns
    closeDropdown();
  }

  // EXPOSE TO GLOBALS SO EXTERNAL SCRIPTS CAN CLOSE MENU (e.g. login.js)
  window.closeMobileMenu = closeMenu;

  /**
   * Close dropdown(s)
   * Mendukung banyak dropdown dalam satu nav (dipakai navbar admin).
   * @param {Element|null} except - dropdown yang tetap dibiarkan terbuka
   */
  function closeDropdown(except = null) {
    document.querySelectorAll(".nav-dropdown").forEach(function (dropdown) {
      if (except && dropdown === except) return;
      dropdown.classList.remove("open");
      const btn = dropdown.querySelector(".nav-link.has-caret");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  /**
   * Toggle mobile menu
   */
  function toggleMenu() {
    const isActive = hamburger.classList.contains("active");
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Hamburger click event
  hamburger.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  // Overlay click event - close menu
  overlay.addEventListener("click", function () {
    closeMenu();
  });

  // Handle navigation links - close menu when clicked
  const navLinks = document.querySelectorAll("nav > a");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (window.innerWidth <= 768) {
        const href = this.getAttribute("href");
        if (href && href.startsWith("#")) {
          closeMenu();
        }
      }
    });
  });

  // Handle dropdown toggle (WORKS FOR BOTH MOBILE & DESKTOP)
  // Semua .nav-dropdown ditangani, sehingga navbar bisa punya beberapa grup menu.
  const dropdowns = Array.from(document.querySelectorAll(".nav-dropdown"));

  dropdowns.forEach(function (dropdown) {
    const button = dropdown.querySelector(".nav-link.has-caret");
    if (!button) return;

    button.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = dropdown.classList.contains("open");

      // Hanya satu dropdown terbuka pada satu waktu
      closeDropdown(dropdown);

      if (isOpen) {
        dropdown.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
      } else {
        dropdown.classList.add("open");
        button.setAttribute("aria-expanded", "true");
      }
    });

    // Close dropdown when clicking dropdown links
    dropdown.querySelectorAll(".dropdown-menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          setTimeout(closeMenu, 100);
        } else {
          closeDropdown();
        }
      });
    });
  });

  // Close dropdown when clicking outside (desktop & mobile)
  document.addEventListener("click", function (e) {
    const clickedInside = dropdowns.some(function (dropdown) {
      return dropdown.contains(e.target);
    });
    if (!clickedInside) closeDropdown();
  });

  // Close dropdown when clicking inside nav (but outside dropdown) - drawer mobile
  nav.addEventListener("click", function (e) {
    if (window.innerWidth > 768) return;
    const clickedInside = dropdowns.some(function (dropdown) {
      return dropdown.contains(e.target);
    });
    if (!clickedInside) closeDropdown();
  });

  // Close menu when window is resized to desktop
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    }, 250);
  });

  // Handle escape key to close menu and dropdown
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;

    const anyOpen = dropdowns.some(function (dropdown) {
      return dropdown.classList.contains("open");
    });

    if (anyOpen) {
      closeDropdown();
    } else if (window.innerWidth <= 768 && nav.classList.contains("active")) {
      closeMenu();
    }
  });

  console.log("Mobile menu initialized successfully");

  // Handle header glassmorphism on scroll
  const headerEl = document.querySelector("header");
  if (headerEl) {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        headerEl.classList.add("scrolled");
      } else {
        headerEl.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
  }
  
  // Force an auth update to populate the newly created mobile auth container
  if (typeof updateNavbarAuth === 'function') {
    updateNavbarAuth();
  }
});
