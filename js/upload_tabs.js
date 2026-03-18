// upload_tabs_manager.js
(function () {
  "use strict";

  function initTabs() {
    const tabs = document.querySelectorAll(".upload-tab");
    const jurnalTab = document.getElementById("jurnalTab");
    const opiniTab = document.getElementById("opiniTab");

    if (tabs.length === 0 || !jurnalTab || !opiniTab) {
      console.warn("Tabs not ready, retrying...");
      setTimeout(initTabs, 100);
      return;
    }

    console.log("Tabs found:", tabs.length);

    // Set initial state
    jurnalTab.style.display = "block";
    opiniTab.style.display = "none";

    // Clone to remove old listeners
    tabs.forEach((tab) => {
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
    });

    // Re-query
    const newTabs = document.querySelectorAll(".upload-tab");

    // Add click handlers
    newTabs.forEach((tab) => {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const targetTab = this.getAttribute("data-tab");
        console.log("Switching to:", targetTab);

        // Remove all active from tabs
        newTabs.forEach((t) => t.classList.remove("active"));

        // Add active to clicked tab
        this.classList.add("active");

        // Hide all content
        jurnalTab.style.display = "none";
        opiniTab.style.display = "none";

        // Show target content
        if (targetTab === "jurnal") {
          jurnalTab.style.display = "block";
          console.log("Showing Jurnal");
        } else if (targetTab === "opini") {
          opiniTab.style.display = "block";
          console.log("Showing Opini");
        }

        // Refresh icons
        if (typeof feather !== "undefined") {
          feather.replace();
        }
      });
    });

    console.log(" Tabs initialized");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTabs);
  } else {
    setTimeout(initTabs, 50);
  }
})();
