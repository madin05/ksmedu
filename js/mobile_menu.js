/**
 * MOBILE_MENU.JS
 * Mobile Menu & Responsive Functionality for Dashboard User
 * KSM EDUCATION
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing mobile menu...");

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
  if (logoEl) {
    const navLogo = document.createElement("div");
    navLogo.className = "nav-logo";
    navLogo.innerHTML = logoEl.innerHTML;
    nav.insertBefore(navLogo, nav.firstChild);
  }

  // Clone auth buttons into nav for mobile side menu
  const authSection = document.querySelector(".auth-section");
  if (authSection) {
    const mobileAuth = document.createElement("div");
    mobileAuth.className = "nav-auth-section";
    mobileAuth.innerHTML = authSection.innerHTML;
    nav.appendChild(mobileAuth);
  }

  // Create overlay for mobile menu
  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  document.body.appendChild(overlay);

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
    * Close dropdown
    */
   function closeDropdown() {
     const dropdown = document.querySelector(".nav-dropdown");
     if (dropdown) {
       dropdown.classList.remove("open");
       const dropdownButton = dropdown.querySelector(".nav-link.has-caret");
       if (dropdownButton) {
         dropdownButton.setAttribute("aria-expanded", "false");
       }
     }
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
  const dropdownButton = document.querySelector(".nav-link.has-caret");
  const dropdown = document.querySelector(".nav-dropdown");

  if (dropdownButton && dropdown) {
    // Click event for dropdown button
    dropdownButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (window.innerWidth <= 768) {
        // MOBILE: Toggle open class
        const isOpen = dropdown.classList.contains("open");

        if (isOpen) {
          dropdown.classList.remove("open");
          this.setAttribute("aria-expanded", "false");
        } else {
          dropdown.classList.add("open");
          this.setAttribute("aria-expanded", "true");
        }
      } else {
        // DESKTOP: Toggle open class
        const isOpen = dropdown.classList.contains("open");

        if (isOpen) {
          dropdown.classList.remove("open");
          this.setAttribute("aria-expanded", "false");
        } else {
          dropdown.classList.add("open");
          this.setAttribute("aria-expanded", "true");
        }
      }
    });

    // Close button inside dropdown (mobile only)
    // const closeButton = dropdown.querySelector(".dropdown-close");
    // if (closeButton) {
    //   closeButton.addEventListener("click", function (e) {
    //     e.stopPropagation();
    //     closeDropdown();
    //   });
    // }

    // Close dropdown when clicking dropdown links
    const dropdownLinks = dropdown.querySelectorAll(".dropdown-menu a");
    dropdownLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 768) {
          setTimeout(function () {
            closeMenu();
          }, 100);
        } else {
          // Desktop: just close dropdown
          closeDropdown();
        }
      });
    });
  }

  // Close dropdown when clicking outside (desktop & mobile)
  document.addEventListener("click", function (e) {
    if (
      dropdown &&
      (dropdown.classList.contains("open"))
    ) {
      const isClickInsideDropdown = dropdown.contains(e.target);
      const isClickOnButton = dropdownButton && dropdownButton.contains(e.target);

      if (!isClickInsideDropdown && !isClickOnButton) {
        closeDropdown();
      }
    }
  });

  // Close dropdown when clicking inside nav (but outside dropdown)
  nav.addEventListener("click", function (e) {
    if (window.innerWidth <= 768) {
      const dropdown = document.querySelector(".nav-dropdown");
      const dropdownButton = document.querySelector(".nav-link.has-caret");
      const dropdownMenu = document.querySelector(".dropdown-menu");

      if (dropdown && dropdown.classList.contains("open")) {
        const isClickOnButton = dropdownButton && dropdownButton.contains(e.target);
        const isClickInDropdown = dropdownMenu && dropdownMenu.contains(e.target);

        if (!isClickOnButton && !isClickInDropdown) {
          closeDropdown();
        }
      }
    }
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
    if (e.key === "Escape") {
      if (window.innerWidth <= 768) {
        const dropdown = document.querySelector(".nav-dropdown");
        if (dropdown && dropdown.classList.contains("open")) {
          closeDropdown();
        } else if (nav.classList.contains("active")) {
          closeMenu();
        }
      } else {
        // Desktop: close dropdown
        const dropdown = document.querySelector(".nav-dropdown");
        if (dropdown && dropdown.classList.contains("open")) {
          closeDropdown();
        }
      }
    }
  });

  console.log("Mobile menu initialized successfully");
});
