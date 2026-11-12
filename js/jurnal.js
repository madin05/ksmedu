  // ===== JOURNAL MANAGEMENT - DATABASE VERSION =====
  //  All features preserved, fully integrated with MySQL database

  class JournalManager {
    constructor() {
      // Container utama (dipakai di beberapa halaman)
      this.journalContainer =
        document.getElementById("journalContainer") ||
        document.getElementById("articlesGrid");

      this.journals = [];
      this.isLoading = true;
      
      // ===== 1) JANGAN JALAN DI HALAMAN USER DASHBOARD =====
      // Biarkan dashboard_user.js yang handle render untuk user
      // ksmPagePath() = pathname with the real script name, so this test works
      // for the clean URL (/user/dashboard) and the legacy .php URL alike.
      const path = ksmPagePath().toLowerCase();
      if (path.includes("dashboard_user.php")) {
        console.warn(
          "User dashboard page - JournalManager DISABLED (handled by dashboard_user.js)",
        );
        return;
      }

      if (path.includes("journals.php")) {
        console.warn(
          "journals.php - JournalManager DISABLED (handled by PaginationManager)",
        );
        return;
      }

      if (path.includes("opinions.php")) {
        console.warn("opinions.php - JournalManager DISABLED");
        return;
      }

      // ===== FIX: BLOK STOP ADMIN DIHAPUS SUPAYA TOMBOL MUNCUL =====
      // Kita biarkan JournalManager jalan di admin biar card dengan 3 tombol ke-render

      // Hanya jalan kalau ada container
      if (this.journalContainer) {
        this.init();
      } else {
        console.warn("Journal container not found on this page - skipping init");
      }
    }

    async init() {
      console.log("JournalManager initializing (Database Mode)...");

      // Clear old localStorage data
      localStorage.removeItem("journals");

      await this.loadJournals();
      this.isLoading = false;
      this.renderJournals();

      window.addEventListener("journals:changed", async () => {
        console.log("Journals changed event received, reloading...");
        await this.loadJournals();
        this.renderJournals();
      });

      window.addEventListener("opinions:changed", async () => {
        console.log("Opinions changed event received, reloading...");
        await this.loadJournals();
        this.renderJournals();
      });
    }

    // ===== LOAD JOURNALS FROM DATABASE =====
    async loadJournals() {
      this.showSkeleton();
      try {
        const timestamp = Date.now();
        const journalRes = await fetch(
          `${window.APP_CONFIG.apiBase}/list_journals.php?limit=100&offset=0&_=${timestamp}`,
          {
            cache: "no-store",
          },
        );
        const journalData = await journalRes.json();

        let journals = [];
        if (journalData.ok && journalData.results) {
          journals = journalData.results.map((j) => ({
            ...this.transformJournal(j),
            _type: "jurnal",
          }));
        }

        // Kalau di dashboard, ambil juga opinions
        if (ksmPagePath().includes("dashboard_admin.php")) {
          const opiniRes = await fetch(
            `${window.APP_CONFIG.apiBase}/list_opinions.php?limit=100&offset=0&_=${timestamp}`,
            {
              cache: "no-store",
            },
          );
          const opiniData = await opiniRes.json();

          let opinions = [];
          if (opiniData.ok && opiniData.results) {
            opinions = opiniData.results.map((o) => ({
              id: String(o.id),
              title: o.title || "Untitled",
              abstract: o.description || "",
              authors: [o.author_name || "Anonymous"],
              tags: (() => {
                try {
                  return JSON.parse(o.tags || "[]");
                } catch (e) {
                  return [];
                }
              })(),
              uploadDate: o.created_at,
              coverImage: (() => {
                const url = o.cover_url;
                if (!url || url === "null" || url === "undefined" || url === "") return "../assets/slideshow-1.jpg";
                if (url.startsWith("http") || url.startsWith("data:")) return url;
                if (url.startsWith("../")) return url;
                if (url.startsWith("uploads/")) return "../" + url;
                if (url.startsWith("/uploads/")) return ".." + url;
                return "../" + url;
              })(),
              views: parseInt(o.views) || 0,
              _type: "opini",
            }));
          }

          // Merge & sort by date
          this.journals = [...journals, ...opinions].sort(
            (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate),
          );
        } else {
          this.journals = journals;
        }
      } catch (error) {
        console.error("Error loading:", error);
        this.journals = [];
      }
    }

    transformJournal(j) {
      const parseJsonField = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) return field;
        try {
          return JSON.parse(field);
        } catch (e) {
          return [];
        }
      };
      const fixCover = (url) => {
        if (!url || url === "null" || url === "undefined" || url === "") return "../assets/slideshow-1.jpg";
        if (url.startsWith("http") || url.startsWith("data:")) return url;
        if (url.startsWith("../")) return url;
        if (url.startsWith("uploads/")) return "../" + url;
        if (url.startsWith("/uploads/")) return ".." + url;
        return "../" + url;
      };
      return {
        id: String(j.id),
        title: j.title || "Untitled",
        abstract: j.abstract || "",
        authors: parseJsonField(j.authors),
        tags: parseJsonField(j.tags),
        pengurus: parseJsonField(j.pengurus),
        volume: j.volume,
        date: j.created_at,
        uploadDate: j.created_at,
        fileData: j.file_url,
        file: j.file_url,
        coverImage: fixCover(j.cover_url),
        email: j.email || "",
        contact: j.contact || "",
        views: parseInt(j.views) || 0,
      };
    }

    showSkeleton() {
      if (!this.journalContainer) return;
      this.journalContainer.innerHTML = "";

      // Check if we are on index or dashboard
      const path = ksmPagePath().toLowerCase();
      const isDashboard =
        path.includes("dashboard_admin.php") ||
        path.includes("dashboard_user.php") ||
        path.endsWith("/admin/") ||
        path.endsWith("/user/") ||
        path.includes("index.html") ||
        path.includes("index.php");

      const count = isDashboard ? 6 : 9;

      for (let i = 0; i < count; i++) {
        if (window.location.pathname.includes("index.html")) {
          // Compact list (Index Page)
          const skeleton = document.createElement("div");
          skeleton.className = "skeleton-compact-item";
          skeleton.innerHTML = `
            <div class="skeleton-thumb skeleton"></div>
            <div class="skeleton-body">
              <div class="skeleton-title skeleton"></div>
              <div class="skeleton-text skeleton"></div>
              <div class="skeleton-text short skeleton"></div>
            </div>
          `;
          this.journalContainer.appendChild(skeleton);
        } else if (this.journalContainer.classList.contains("list-view")) {
          // Horizontal List View (journals.php, opinions.php)
          const skeleton = document.createElement("div");
          skeleton.className = "skeleton-list";
          skeleton.innerHTML = `
            <div class="skeleton-list-thumb skeleton"></div>
            <div class="skeleton-list-content">
              <div class="skeleton-title medium skeleton"></div>
              <div class="skeleton-text skeleton"></div>
              <div class="skeleton-text skeleton"></div>
              <div class="skeleton-text short skeleton"></div>
            </div>
          `;
          this.journalContainer.appendChild(skeleton);
        } else {
          // Grid cards (Dashboard)
          const skeleton = document.createElement("div");
          skeleton.className = "skeleton-card";
          skeleton.innerHTML = `
            <div class="skeleton-image skeleton"></div>
            <div class="skeleton-content">
              <div class="skeleton-title skeleton"></div>
              <div class="skeleton-text skeleton"></div>
              <div class="skeleton-text skeleton"></div>
              <div class="skeleton-text short skeleton"></div>
              <div class="skeleton-tag-container">
                <div class="skeleton-tag skeleton"></div>
                <div class="skeleton-tag skeleton"></div>
              </div>
              <div class="skeleton-meta">
                <div class="skeleton-avatar skeleton"></div>
                <div class="skeleton-text short skeleton"></div>
              </div>
            </div>
          `;
          this.journalContainer.appendChild(skeleton);
        }
      }
    }

    // ===== RENDER JOURNALS =====
    renderJournals() {
      if (!this.journalContainer) return;
      
      // Jangan render jika masih loading (biarkan skeleton tetap ada)
      if (this.isLoading && this.journals.length === 0) {
        console.log("Still loading journals, keeping skeleton...");
        return;
      }

      this.journalContainer.innerHTML = "";

      if (this.journals.length === 0) {
        this.journalContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon"></div>
            <h3>Belum Ada Jurnal</h3>
            <p>Upload jurnal pertama kamu di form di bawah!</p>
          </div>
        `;
        updateLatestNav(this.journals); // panggil nav
        return;
      }

      const isDashboard = ksmPagePath().includes(
        "dashboard_admin.php",
      );
      const journalsToShow = isDashboard
        ? this.journals.slice(0, 6)
        : this.journals;

      journalsToShow.forEach((journal) => {
        const card = this.createJournalCard(journal);
        this.journalContainer.appendChild(card);
      });

      if (typeof feather !== "undefined") {
        feather.replace();
      }

      // panggil nav setiap kali render
      updateLatestNav(this.journals);
    }

    // ===== CREATE JOURNAL CARD =====
    createJournalCard(journal) {
      // ===== CEK ADMIN MODE =====
      // Paksa true jika di halaman admin, biar tombol selalu muncul
      const isAdmin =
        sessionStorage.getItem("userType") === "admin" ||
        ksmPagePath().includes("dashboard_admin.php") ||
        ksmPagePath().includes("journals.php");

      const card = document.createElement("div");
      card.className = isAdmin ? "journal-card" : "article-card";
      card.setAttribute("data-journal-id", journal.id);

      // Style Inline biar layout Grid Admin rapi
      card.style.cssText = `
        display: flex; 
        flex-direction: column; 
        /* var(--ksm-c-card-bg) di-set oleh styles/base/dark_mode/dark_mode_p5.css saat
           data-theme="dark"; fallback "white" menjaga tampilan light mode. */
        background: var(--ksm-c-card-bg, white);
        border-radius: 10px; 
        overflow: visible; 
        box-shadow: 0 2px 15px rgba(0,0,0,0.08); 
        transition: transform 0.3s;
        height: 100%;
      `;

      if (!isAdmin) {
        card.style.cursor = "pointer";
        card.onclick = () => this.viewJournal(journal.id);
      }

      const truncateText = (text, maxLength) => {
        if (!text) return "";
        return text.length > maxLength
          ? text.substring(0, maxLength) + "..."
          : text;
      };

      const formatDate = (dateString) => {
        try {
          return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        } catch (e) {
          return dateString;
        }
      };

      const getFirstAuthor = (authors) => {
        if (Array.isArray(authors) && authors.length > 0) {
          return authors[0];
        }
        return "Unknown Author";
      };

      const safeTitle = (journal.title || "").replace(/['"]/g, "");
      const isOpini = journal._type === "opini";

      card.innerHTML = `
        <div style="width: 100%; height: 200px; overflow: hidden; position: relative;">
            <img src="${journal.coverImage}" 
              alt="${journal.title}" 
              style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; color: transparent;"
              onerror="this.onerror=null; this.src='../assets/slideshow-1.jpg'">
          <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: flex; align-items: center; gap: 4px; font-weight: 600;">
            <i data-feather="eye" style="width: 14px; height: 14px;"></i> ${
              journal.views
            }
          </div>
          <div style="position:absolute; top:12px; left:12px; background:${
            journal._type === "opini" ? "#9b59b6" : "#3498db"
          }; color:white; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600;">
    ${journal._type === "opini" ? "Opini" : "Jurnal"}
  </div>
        </div>
        
        <div style="padding: 20px; display: flex; flex-direction: column; flex: 1;">
          <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--ksm-c-card-title, #2c3e50); line-height: 1.4;">${truncateText(
            journal.title,
            60,
          )}</h3>
          
          <p style="font-size: 14px; color: var(--ksm-c-card-text, #666); line-height: 1.6; margin-bottom: 16px;">${truncateText(
            journal.abstract || "No abstract available",
            150,
          )}</p>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: var(--ksm-c-card-meta, #888); margin-top: auto; padding-top: 12px; border-top: 1px solid var(--ksm-c-card-border, #f0f0f0);">
            <span style="display: flex; align-items: center; gap: 4px;">
              <i data-feather="user" style="width: 14px; height: 14px;"></i> ${getFirstAuthor(
                journal.authors,
              )}
            </span>
            <span style="display: flex; align-items: center; gap: 4px;">
              <i data-feather="calendar" style="width: 14px; height: 14px;"></i> ${formatDate(
                journal.uploadDate,
              )}
            </span>
          </div>

          ${
            journal.tags && journal.tags.length > 0
              ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px;">
              ${journal.tags
                .slice(0, 3)
                .map(
                  (tag) =>
                    `<span style="background: var(--ksm-c-tag-bg, #f0f0f0); color: var(--ksm-c-tag-text, #666); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;">${tag}</span>`,
                )
                .join("")}
              ${
                journal.tags.length > 3
                  ? `<span style="background: var(--ksm-c-tag-more-bg, #2c3e50); color: var(--ksm-c-tag-more-text, white); padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">+${
                      journal.tags.length - 3
                    }</span>`
                  : ""
              }
            </div>
          `
              : ""
          }

          ${
            isAdmin
              ? (() => {
                  const cardType = journal._type || 'jurnal';
                  const dropdownKey = `${cardType}-${journal.id}`;
                  return `
            <div class="card-actions">
              <div class="dropdown-menu-container">
                <button class="dropdown-toggle" type="button" onclick="event.stopPropagation(); window.toggleDropdown ? window.toggleDropdown('${dropdownKey}') : toggleDropdown('${dropdownKey}')" title="Aksi">
                  <i data-feather="more-vertical"></i>
                </button>
                <div id="dropdown-${dropdownKey}" class="dropdown-content">
                  <button type="button" class="dropdown-item-btn dd-download" onclick="event.stopPropagation(); downloadJournalPdf('${journal.file || journal.fileData || ''}', '${safeTitle}'); window.closeDropdown ? window.closeDropdown('${dropdownKey}') : closeDropdown('${dropdownKey}')">
                    <i data-feather="download"></i> Download
                  </button>
                  <button type="button" class="dropdown-item-btn dd-edit" onclick="event.stopPropagation(); ${
                    isOpini
                      ? `window.openEditOpinionModal('${journal.id}')`
                      : `window.editJournalManager?.openEditModal('${journal.id}')`
                  }; window.closeDropdown ? window.closeDropdown('${dropdownKey}') : closeDropdown('${dropdownKey}')">
                    <i data-feather="edit"></i> Edit
                  </button>
                  <button type="button" class="dropdown-item-btn dd-delete" onclick="event.stopPropagation(); ${
                    isOpini
                      ? `window.deleteOpinion('${journal.id}', '${safeTitle}')`
                      : `(window.deleteJournal ? window.deleteJournal('${journal.id}', '${safeTitle}') : journalManager.deleteJournal('${journal.id}', '${safeTitle}'))`
                  }; window.closeDropdown ? window.closeDropdown('${dropdownKey}') : closeDropdown('${dropdownKey}')">
                    <i data-feather="trash-2"></i> Hapus
                  </button>
                  <button type="button" class="dropdown-item-btn dd-share" onclick="event.stopPropagation(); openShareModal('${journal.id}', '${cardType}'); window.closeDropdown ? window.closeDropdown('${dropdownKey}') : closeDropdown('${dropdownKey}')">
                    <i data-feather="share-2"></i> Share
                  </button>
                </div>
              </div>
            </div>
                  `;
                })()
              : ""
          }
        </div>
      `;

      // Cover click - explore page (admin & user)
      const coverDiv = card.querySelector('div[style*="height: 200px"]');
      if (coverDiv) {
        coverDiv.style.cursor = "pointer";
        const exploreType = journal._type === "opini" ? "opini" : "jurnal";
        const explorePage =
          journal._type === "opini"
            ? "explore_opini"
            : "explore_jurnal";
        coverDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          window.location.href = `${explorePage}?id=${journal.id}&type=${exploreType}`;
        });
      }

      return card;
    }

    viewJournal(id) {
      console.log(" Viewing journal:", id);
      this.updateViews(id);
      window.location.href = `explore_jurnal?id=${id}&type=jurnal`;
    }

    async deleteJournal(id, title = "") {
      if (!id) {
        showAlert.warning("ID journal tidak valid", "ID Tidak Valid");
        return;
      }
      const confirmMsg = title
        ? `Yakin ingin menghapus jurnal "${title}"?\n\nData akan dihapus permanent dari database!`
        : `Yakin ingin menghapus jurnal ini?\n\nData akan dihapus permanent dari database!`;

      const confirmed = await showAlert.confirm(confirmMsg, "Konfirmasi Hapus");
      if (!confirmed) return;

      try {
        const card = document.querySelector(`[data-journal-id="${id}"]`);
        if (card) {
          card.style.opacity = "0.5";
          card.style.pointerEvents = "none";
        }

        const item = this.journals.find((j) => String(j.id) === String(id));
        const isOpini = item?._type === "opini";
        const deleteEndpoint = isOpini
          ? `${window.APP_CONFIG.apiBase}/delete_opinion.php?id=${encodeURIComponent(id)}`
          : `${window.APP_CONFIG.apiBase}/delete_journal.php?id=${encodeURIComponent(id)}`;

        const response = await fetch(deleteEndpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();
        if (result.ok) {
          showAlert.success("Jurnal berhasil dihapus!", "Sukses");
          this.journals = this.journals.filter(
            (j) => String(j.id) !== String(id),
          );
          this.renderJournals();
          window.dispatchEvent(
            new CustomEvent("journals:changed", {
              detail: { action: "deleted", id: id },
            }),
          );

          if (window.statisticManager) {
            setTimeout(async () => {
              await window.statisticManager.fetchStatistics();
            }, 500);
          }
        } else {
          throw new Error(
            result.message || "Gagal menghapus jurnal dari database",
          );
        }
      } catch (error) {
        showAlert.error("Gagal menghapus jurnal: " + error.message, "Gagal");
        const card = document.querySelector(`[data-journal-id="${id}"]`);
        if (card) {
          card.style.opacity = "1";
          card.style.pointerEvents = "auto";
        }
      }
    }

    async updateViews(id) {
      try {
        const response = await fetch(`${window.APP_CONFIG.apiBase}/update_views.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: id, type: "journal" }),
        });
        const result = await response.json();
        if (result.ok) {
          const journal = this.journals.find(
            (j) => j.id === id || j.id === String(id),
          );
          if (journal) journal.views = (journal.views || 0) + 1;
        }
      } catch (error) {
        console.warn("Failed to update views:", error);
      }
    }

    searchJournals(query) {
      if (!query || query.trim() === "") {
        this.renderJournals();
        return;
      }
      const searchQuery = query.toLowerCase().trim();
      const filtered = this.journals.filter((journal) => {
        return (
          journal.title.toLowerCase().includes(searchQuery) ||
          journal.abstract.toLowerCase().includes(searchQuery) ||
          (Array.isArray(journal.authors) &&
            journal.authors.some((author) =>
              author.toLowerCase().includes(searchQuery),
            )) ||
          (Array.isArray(journal.tags) &&
            journal.tags.some((tag) => tag.toLowerCase().includes(searchQuery)))
        );
      });
      this.renderFilteredJournals(filtered, query);
    }

    renderFilteredJournals(filtered, query) {
      if (!this.journalContainer) return;
      this.journalContainer.innerHTML = "";
      if (filtered.length === 0) {
        this.journalContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon"></div><h3>Tidak Ada Hasil</h3><p>Tidak ditemukan jurnal dengan kata kunci "${query}"</p></div>`;
        return;
      }
      filtered.forEach((journal) => {
        const card = this.createJournalCard(journal);
        this.journalContainer.appendChild(card);
      });
      if (typeof feather !== "undefined") feather.replace();
    }

    sortJournals(sortBy) {
      let sorted = [...this.journals];
      switch (sortBy) {
        case "newest":
          sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
          break;
        case "oldest":
          sorted.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
          break;
        case "title":
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "views":
          sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
          break;
      }
      this.journals = sorted;
      this.renderJournals();
    }

    getJournalById(id) {
      return this.journals.find((j) => j.id === id || j.id === String(id));
    }
    getTotalCount() {
      return this.journals.length;
    }
    getTotalViews() {
      return this.journals.reduce(
        (total, journal) => total + (journal.views || 0),
        0,
      );
    }
  }

  // ===== NAV "LIHAT SEMUA" UNTUK DASHBOARD USER & ADMIN =====
  function updateLatestNav(journals) {
    if (!Array.isArray(journals)) journals = [];

    // Dashboard user (home / dashboard_user.php)
    const navUser = document.getElementById("latestArticlesNavUser");
    if (navUser) {
      if (journals.length > 6) {
        navUser.innerHTML = `
          <button class="btn-see-all" onclick="window.location.href='journals'">
            Lihat semua artikel
          </button>
        `;
      } else {
        navUser.innerHTML = "";
      }
    }

    // Dashboard admin (dashboard_admin.php)
    const navAdmin = document.getElementById("latestArticlesNavAdmin");
    if (navAdmin) {
      if (journals.length > 6) {
        navAdmin.innerHTML = `
          <button class="btn-see-all" onclick="window.location.href='journals'">
            Lihat semua artikel
          </button>
        `;
      } else {
        navAdmin.innerHTML = "";
      }
    }
  }

  // ===== INITIALIZE WHEN DOM IS READY =====
  let journalManager;
  document.addEventListener("DOMContentLoaded", () => {
    if (window.journalManager) {
      console.warn("JournalManager already initialized, skipping...");
      return;
    }
    journalManager = new JournalManager();
    console.log(" JournalManager initialized (Full Database Integration)");
    window.journalManager = journalManager;
  });

  // ===== DROPDOWN FUNCTIONS FOR ADMIN ACTIONS =====
  function toggleDropdown(key) {
    let dropdown = document.getElementById(`dropdown-${key}`);
    if (!dropdown) {
      dropdown = document.getElementById(`dropdown-jurnal-${key}`) ||
                 document.getElementById(`dropdown-opini-${key}`) ||
                 document.getElementById(`pg-dropdown-${key}`);
    }
    if (!dropdown) return;

    const isVisible = dropdown.classList.contains("show") || dropdown.style.display === "block";

    // Close all other dropdowns first
    document.querySelectorAll(".dropdown-content").forEach((d) => {
      d.style.display = "none";
      d.classList.remove("show");
    });

    // Toggle current dropdown
    if (!isVisible) {
      dropdown.style.display = "block";
      dropdown.classList.add("show");

      const closeHandler = (e) => {
        if (
          !dropdown.contains(e.target) &&
          !e.target.closest(".dropdown-toggle")
        ) {
          dropdown.style.display = "none";
          dropdown.classList.remove("show");
          document.removeEventListener("click", closeHandler);
        }
      };
      setTimeout(() => {
        document.addEventListener("click", closeHandler);
      }, 10);
    } else {
      dropdown.style.display = "none";
      dropdown.classList.remove("show");
    }
  }

  function closeDropdown(key) {
    let dropdown = document.getElementById(`dropdown-${key}`);
    if (!dropdown) {
      dropdown = document.getElementById(`dropdown-jurnal-${key}`) ||
                 document.getElementById(`dropdown-opini-${key}`) ||
                 document.getElementById(`pg-dropdown-${key}`);
    }
    if (dropdown) {
      dropdown.style.display = "none";
      dropdown.classList.remove("show");
    }
  }

  window.toggleDropdown = toggleDropdown;
  window.closeDropdown = closeDropdown;

  console.log("jurnal.js loaded (Database Mode)");
