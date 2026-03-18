// ===== JOURNAL MANAGEMENT - DATABASE VERSION =====
//  All features preserved, fully integrated with MySQL database

class JournalManager {
  constructor() {
    // Container utama (dipakai di beberapa halaman)
    this.journalContainer =
      document.getElementById("journalContainer") ||
      document.getElementById("articlesGrid");

    this.journals = [];

    // ===== 1) JANGAN JALAN DI HALAMAN USER DASHBOARD =====
    // Biarkan dashboard_user.js yang handle render untuk user
    if (window.location.pathname.includes("dashboard_user.html")) {
      console.warn(
        "User dashboard page - JournalManager DISABLED (handled by dashboard_user.js)",
      );
      return;
    }

    if (window.location.pathname.includes("journals.html")) {
      console.warn("journals.html - JournalManager DISABLED...");
      return;
    }

    if (window.location.pathname.includes("opinions.html")) {
      console.warn("opinions.html - JournalManager DISABLED");
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
    this.renderJournals();

    window.addEventListener("journals:changed", async () => {
      console.log("Journals changed event received, reloading...");
      await this.loadJournals();
      this.renderJournals();
    });
  }

  // ===== LOAD JOURNALS FROM DATABASE =====
  async loadJournals() {
    try {
      const timestamp = Date.now();
      const journalRes = await fetch(
        `/ksmaja/api/list_journals.php?limit=100&offset=0&_=${timestamp}`,
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
      if (window.location.pathname.includes("dashboard_admin.html")) {
        const opiniRes = await fetch(
          `/ksmaja/api/list_opinions.php?limit=100&offset=0&_=${timestamp}`,
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
            coverImage:
              o.cover_url ||
              "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
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
      coverImage:
        j.cover_url ||
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
      email: j.email || "",
      contact: j.contact || "",
      views: parseInt(j.views) || 0,
    };
  }

  // ===== RENDER JOURNALS =====
  renderJournals() {
    if (!this.journalContainer) {
      console.warn("Journal container not found!");
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

    const isDashboard = window.location.pathname.includes(
      "dashboard_admin.html",
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
      window.location.pathname.includes("dashboard_admin.html") ||
      window.location.pathname.includes("journals.html");

    const card = document.createElement("div");
    card.className = isAdmin ? "journal-card" : "article-card";
    card.setAttribute("data-journal-id", journal.id);

    // Style Inline biar layout Grid Admin rapi
    card.style.cssText = `
      display: flex; 
      flex-direction: column; 
      background: white; 
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

    card.innerHTML = `
      <div style="width: 100%; height: 200px; overflow: hidden; position: relative;">
        <img src="${journal.coverImage}" 
             alt="${journal.title}" 
             style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s;"
             onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
        <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; display: flex; align-items: center; gap: 4px; font-weight: 600;">
          <i data-feather="eye" style="width: 14px; height: 14px;"></i> ${
            journal.views
          }
        </div>
        <div style="position:absolute; top:12px; left:12px; background:${
          journal._type === "opini" ? "#9b59b6" : "#3498db"
        }; color:white; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:600;">
  ${journal._type === "opini" ? "OPINI" : "JURNAL"}
</div>
      </div>
      
      <div style="padding: 20px; display: flex; flex-direction: column; flex: 1;">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #2c3e50; line-height: 1.4;">${truncateText(
          journal.title,
          60,
        )}</h3>
        
        <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 16px;">${truncateText(
          journal.abstract || "No abstract available",
          150,
        )}</p>
        
        <div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #888; margin-top: auto; padding-top: 12px; border-top: 1px solid #f0f0f0;">
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
                  `<span style="background: #f0f0f0; color: #666; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;">${tag}</span>`,
              )
              .join("")}
            ${
              journal.tags.length > 3
                ? `<span style="background: #2c3e50; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">+${
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
            ? `
          <div class="journal-actions" style="display: flex !important; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <div class="dropdown-menu-container" style="position: relative;">
              <button class="dropdown-toggle" onclick="event.stopPropagation(); toggleDropdown('${journal.id}')" style="background: none; border: none; cursor: pointer; padding: 6px; border-radius: 50%; transition: background 0.2s; color: #666;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
                <i data-feather="more-vertical" style="width: 20px; height: 20px;"></i>
              </button>
              <div id="dropdown-${journal.id}" class="dropdown-content" style="display: none; position: absolute; right: 0; bottom: 100%; background: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 1000; min-width: 140px; padding: 4px 0; margin-bottom: 4px;">
                <button onclick="event.stopPropagation(); journalManager.viewJournal('${journal.id}'); closeDropdown('${journal.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #3498db;">
                  <i data-feather="eye" style="width:14px; height:14px;"></i> Detail
                </button>
                <button onclick="event.stopPropagation(); window.editJournalManager.openEditModal('${journal.id}'); closeDropdown('${journal.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #f39c12;">
                  <i data-feather="edit" style="width:14px; height:14px;"></i> Edit
                </button>
                <button onclick="event.stopPropagation(); journalManager.deleteJournal('${journal.id}', '${journal.title.replace(/'/g, "\\'")}'); closeDropdown('${journal.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #e74c3c;">
                  <i data-feather="trash-2" style="width:14px; height:14px;"></i> Hapus
                </button>
                <button onclick="event.stopPropagation(); openShareModal('${journal.id}'); closeDropdown('${journal.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #27ae60;">
                  <i data-feather="share-2" style="width:14px; height:14px;"></i> Share
                </button>
              </div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;

    // Cover click - explore page (admin & user)
    const coverDiv = card.querySelector('div[style*="height: 200px"]');
    if (coverDiv) {
      coverDiv.style.cursor = "pointer";
      const exploreType = journal._type === "opini" ? "opini" : "jurnal";
      const explorePage = journal._type === "opini" ? "explore_opini_admin.html" : "explore_jurnal_admin.html";
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
    window.location.href = `explore_jurnal_admin.html?id=${id}&type=jurnal`;
  }

  async deleteJournal(id, title = "") {
    if (!id) {
      alert(" ID journal tidak valid");
      return;
    }
    const confirmMsg = title
      ? `Yakin ingin menghapus jurnal "${title}"?\n\nData akan dihapus permanent dari database!`
      : `Yakin ingin menghapus jurnal ini?\n\nData akan dihapus permanent dari database!`;

    if (!confirm(confirmMsg)) return;

    try {
      const card = document.querySelector(`[data-journal-id="${id}"]`);
      if (card) {
        card.style.opacity = "0.5";
        card.style.pointerEvents = "none";
      }

      const item = this.journals.find((j) => String(j.id) === String(id));
      const isOpini = item?._type === "opini";
      const deleteEndpoint = isOpini
        ? `/ksmaja/api/delete_opinion.php?id=${encodeURIComponent(id)}`
        : `/ksmaja/api/delete_journal.php?id=${encodeURIComponent(id)}`;

      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (result.ok) {
        alert(" Jurnal berhasil dihapus!");
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
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(
          result.message || "Gagal menghapus jurnal dari database",
        );
      }
    } catch (error) {
      alert(" Gagal menghapus jurnal: " + error.message);
      const card = document.querySelector(`[data-journal-id="${id}"]`);
      if (card) {
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
      }
    }
  }

  async updateViews(id) {
    try {
      const response = await fetch(`/ksmaja/api/update_views.php`, {
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

  // Dashboard user (home / dashboard_user.html)
  const navUser = document.getElementById("latestArticlesNavUser");
  if (navUser) {
    if (journals.length > 6) {
      navUser.innerHTML = `
        <button class="btn-see-all" onclick="window.location.href='journals_user.html'">
          Lihat semua artikel
        </button>
      `;
    } else {
      navUser.innerHTML = "";
    }
  }

  // Dashboard admin (dashboard_admin.html)
  const navAdmin = document.getElementById("latestArticlesNavAdmin");
  if (navAdmin) {
    if (journals.length > 6) {
      navAdmin.innerHTML = `
        <button class="btn-see-all" onclick="window.location.href='journals.html'">
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
function toggleDropdown(journalId) {
  const dropdown = document.getElementById(`dropdown-${journalId}`);
  const isVisible = dropdown.style.display === 'block';
  
  // Close all other dropdowns first
  document.querySelectorAll('.dropdown-content').forEach(d => {
    d.style.display = 'none';
  });
  
  // Toggle current dropdown
  dropdown.style.display = isVisible ? 'none' : 'block';
  
  // Close dropdown when clicking outside
  if (!isVisible) {
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target) && !e.target.closest('.dropdown-toggle')) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', closeDropdown);
      }
    });
  }
}

function closeDropdown(journalId) {
  const dropdown = document.getElementById(`dropdown-${journalId}`);
  dropdown.style.display = 'none';
}

console.log("jurnal.js loaded (Database Mode)");
