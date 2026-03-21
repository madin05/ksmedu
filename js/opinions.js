// ===== OPINIONS PAGE MANAGER - DATABASE VERSION =====
//  All features preserved, fully integrated with MySQL database

class OpinionsPageManager {
  constructor() {
    this.container = document.getElementById("opinionsContainer");
    this.opinionsPerPage = 12;
    this.currentPage = 1;
    this.opinions = [];
    this.filteredOpinions = [];
    this.currentFilter = "all";
    this.currentSort = "newest";

    console.log("OpinionsPageManager initializing (Database Mode)...");
    this.init();
  }

  async init() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("dashboard_admin.php")) {
      console.warn(
        "Dashboard admin page - OpinionsPageManager DISABLED (handled by JournalManager)",
      );
      return;
    }

    if (path.includes("opinions.php")) {
      console.warn(
        "opinions.php - OpinionsPageManager DISABLED (handled by PaginationManager)",
      );
      return;
    }

    if (!this.container) {
      console.warn("Opinions container not found!");
      return;
    }

    //  Load opinions from database
    await this.loadOpinions();

    console.log(
      "OpinionsPageManager initialized with",
      this.opinions.length,
      "opinions",
    );

    //  FEATURE: Render UI
    this.render();
    this.setupSort();
    this.setupSearch();
    this.renderPagination();

    //  FEATURE: Listen to storage changes (fallback compatibility)
    window.addEventListener("storage", async (e) => {
      if (e.key === "opinions") {
        console.log("Storage changed, reloading opinions...");
        await this.loadOpinions();
        this.applyFiltersAndSort();
      }
    });

    //  FEATURE: Listen to custom events
    window.addEventListener("opinions:changed", async () => {
      console.log("Opinions changed event triggered");
      await this.loadOpinions();
      this.applyFiltersAndSort();
    });
  }

  // ===== LOAD OPINIONS FROM DATABASE =====
  async loadOpinions() {
    try {
      console.log("Loading opinions from database...");

      const response = await fetch(
        "/ksmaja/api/list_opinions.php?limit=100&offset=0",
      );
      const data = await response.json();

      if (data.ok && data.results) {
        //  Transform database format to app format
        this.opinions = data.results.map((o) => {
          return {
            id: String(o.id), // Ensure string ID for consistency
            title: o.title || "Untitled",
            description: o.description || "",
            category: o.category || "opini",
            author_name: o.author_name || "Anonymous",
            date: o.created_at,
            uploadDate: o.created_at,
            coverImage:
              o.cover_url ||
              "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
            fileUrl: o.file_url,
            file: o.file_url,
            views: parseInt(o.views) || 0,
          };
        });

        this.filteredOpinions = [...this.opinions];
        console.log(` Loaded ${this.opinions.length} opinions from database`);
      } else {
        console.warn("No opinions found in database response");
        this.opinions = [];
        this.filteredOpinions = [];
      }
    } catch (error) {
      console.error(" Error loading opinions from database:", error);

      //  FEATURE: Fallback to localStorage if database fails
      console.warn("Falling back to localStorage...");
      const stored = localStorage.getItem("opinions");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          this.opinions = data;
          this.filteredOpinions = [...this.opinions];
          console.log(
            `Loaded ${this.opinions.length} opinions from localStorage (fallback)`,
          );
        } catch (e) {
          console.error("Error parsing opinions:", e);
          this.opinions = [];
          this.filteredOpinions = [];
        }
      } else {
        console.log("No opinions found in localStorage");
        this.opinions = [];
        this.filteredOpinions = [];
      }
    }
  }

  // ===== RENDER OPINIONS =====
  render() {
    if (!this.container) return;

    //  FEATURE: Empty state UI
    if (this.filteredOpinions.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"></div>
          <h3>Belum Ada Opini</h3>
          <p>Artikel opini akan muncul di sini setelah admin mengupload</p>
        </div>
      `;
      return;
    }

    //  FEATURE: Pagination calculation
    const start = (this.currentPage - 1) * this.opinionsPerPage;
    const end = start + this.opinionsPerPage;
    const opinionsToShow = this.filteredOpinions.slice(start, end);

    this.container.innerHTML = "";

    //  FEATURE: Render opinion cards
    opinionsToShow.forEach((opinion) => {
      const card = this.createOpinionCard(opinion);
      this.container.appendChild(card);
    });

    //  FEATURE: Refresh feather icons
    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  // ===== CREATE OPINION CARD =====
  createOpinionCard(opinion) {
    const card = document.createElement("div");
    card.className = "opinion-card";
    card.setAttribute("data-opinion-id", opinion.id);

    //  FEATURE: Helper function for text truncation
    const truncateText = (text, maxLength) => {
      if (!text) return "";
      return text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;
    };

    //  FEATURE: Format date nicely
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

    //  FEATURE: Category badge color
    const getCategoryClass = (category) => {
      const categories = {
        opini: "category-opini",
        artikel: "category-artikel",
        berita: "category-berita",
        editorial: "category-editorial",
      };
      return categories[category] || "category-default";
    };

    card.innerHTML = `
      <div class="opinion-cover">
        <img src="${opinion.coverImage}" 
             alt="${opinion.title}" 
             onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
        <div class="opinion-views">
          <i data-feather="eye"></i> ${opinion.views}
        </div>
      </div>
      <div class="opinion-content">
        <span class="opinion-category ${getCategoryClass(opinion.category)}">${
          opinion.category
        }</span>
        <h3 class="opinion-title">${truncateText(opinion.title, 60)}</h3>
        <p class="opinion-description">${truncateText(
          opinion.description,
          150,
        )}</p>
        <div class="opinion-meta">
          <span class="opinion-author">
            <i data-feather="user"></i> ${opinion.author_name}
          </span>
          <span class="opinion-date">
            <i data-feather="calendar"></i> ${formatDate(opinion.uploadDate)}
          </span>
        </div>
        <div class="journal-tags">
              ${item.tags
                .slice(0, 3)
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
              ${
                item.tags.length > 3
                  ? `<span class="tag-more">+${item.tags.length - 3}</span>`
                  : ""
              }
            </div>
        <div class="card-actions">
          <button class="dropdown-item-btn dd-detail" onclick="opinionsManager.viewOpinion('${opinion.id}')" style="width:auto;">
            <i data-feather="eye"></i> Lihat Detail
          </button>
          <button class="dropdown-item-btn dd-delete" onclick="opinionsManager.deleteOpinion('${opinion.id}', '${opinion.title.replace(/'/g, "\\'")}')" style="width:auto;">
            <i data-feather="trash-2"></i> Hapus
          </button>
        </div>
      </div>
    `;

    return card;
  }

  // ===== VIEW OPINION DETAIL =====
  viewOpinion(id) {
    console.log(" Viewing opinion:", id);

    //  FEATURE: Update views count in database
    this.updateViews(id);

    //  FEATURE: Navigate to detail page
    window.location.href = `explore_jurnal_user.php?id=${id}&type=opini`;
  }

  // ===== DELETE OPINION FROM DATABASE =====
  async deleteOpinion(id, title) {
    //  FEATURE: Confirmation dialog
    const confirmed = await showAlert.confirm(
      `Yakin ingin menghapus opini "${title}"?`,
      "Konfirmasi Hapus"
    );
    if (!confirmed) {
      return;
    }

    try {
      console.log(`Deleting opinion ID: ${id}`);

      //  Show loading indicator
      const card = document.querySelector(`[data-opinion-id="${id}"]`);
      if (card) {
        card.style.opacity = "0.5";
        card.style.pointerEvents = "none";
      }

      //  Delete from database via API
      const response = await fetch(`/ksmaja/api/delete_opinion.php?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.ok) {
        console.log(" Opinion deleted from database successfully");

        //  FEATURE: Success notification
        showAlert.success("Opini berhasil dihapus!", "Sukses");

        //  FEATURE: Remove from local arrays
        this.opinions = this.opinions.filter(
          (o) => o.id !== id && o.id !== String(id),
        );
        this.filteredOpinions = this.filteredOpinions.filter(
          (o) => o.id !== id && o.id !== String(id),
        );

        //  FEATURE: Re-render UI
        this.render();
        this.renderPagination();

        //  FEATURE: Trigger event for other components
        window.dispatchEvent(
          new CustomEvent("opinions:changed", {
            detail: {
              action: "deleted",
              id: id,
            },
          }),
        );

        console.log(" Opinion deleted and UI updated");
      } else {
        throw new Error(
          result.message || "Gagal menghapus opini dari database",
        );
      }
    } catch (error) {
      console.error(" Delete error:", error);

      //  FEATURE: Error notification
      showAlert.error("Gagal menghapus opini: " + error.message, "Gagal");

      //  Restore card UI on error
      const card = document.querySelector(`[data-opinion-id="${id}"]`);
      if (card) {
        card.style.opacity = "1";
        card.style.pointerEvents = "auto";
      }
    }
  }

  // ===== UPDATE VIEWS COUNT =====
  async updateViews(id) {
    try {
      console.log("Updating views for opinion:", id);

      //  Update views in database
      const response = await fetch(`/ksmaja/api/update_views.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          type: "opinion",
        }),
      });

      const result = await response.json();

      if (result.ok) {
        console.log(" Views updated in database");

        //  FEATURE: Update local data
        const opinion = this.opinions.find(
          (o) => o.id === id || o.id === String(id),
        );
        if (opinion) {
          opinion.views = (opinion.views || 0) + 1;
        }
      }
    } catch (error) {
      console.warn("Failed to update views:", error);
      //  FEATURE: Silent fail - don't break user experience
    }
  }

  // ===== SETUP SORT =====
  setupSort() {
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.applyFiltersAndSort();
      });
    }
  }

  // ===== SETUP SEARCH =====
  setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
          this.filteredOpinions = [...this.opinions];
        } else {
          this.filteredOpinions = this.opinions.filter(
            (o) =>
              o.title.toLowerCase().includes(query) ||
              o.description.toLowerCase().includes(query) ||
              o.author_name.toLowerCase().includes(query) ||
              o.category.toLowerCase().includes(query),
          );
        }

        this.currentPage = 1;
        this.render();
        this.renderPagination();
      });
    }
  }

  // ===== APPLY FILTERS AND SORT =====
  applyFiltersAndSort() {
    this.filteredOpinions = [...this.opinions];

    //  FEATURE: Apply sorting
    if (this.currentSort === "newest") {
      this.filteredOpinions.sort(
        (a, b) => new Date(b.uploadDate) - new Date(a.uploadDate),
      );
    } else if (this.currentSort === "oldest") {
      this.filteredOpinions.sort(
        (a, b) => new Date(a.uploadDate) - new Date(b.uploadDate),
      );
    } else if (this.currentSort === "title") {
      this.filteredOpinions.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.currentSort === "views") {
      this.filteredOpinions.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    this.currentPage = 1;
    this.render();
    this.renderPagination();
  }

  // ===== FILTER BY CATEGORY =====
  filterByCategory(category) {
    if (category === "all") {
      this.filteredOpinions = [...this.opinions];
    } else {
      this.filteredOpinions = this.opinions.filter(
        (o) => o.category === category,
      );
    }

    this.currentPage = 1;
    this.render();
    this.renderPagination();
  }

  // ===== RENDER PAGINATION =====
  renderPagination() {
    const totalPages = Math.ceil(
      this.filteredOpinions.length / this.opinionsPerPage,
    );

    const paginationContainer = document.getElementById("pagination");

    if (!paginationContainer || totalPages <= 1) {
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    paginationContainer.innerHTML = "";

    //  FEATURE: Previous button
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    paginationContainer.appendChild(prevBtn);

    //  FEATURE: Page number buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2),
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page button if needed
    if (startPage > 1) {
      const firstBtn = this.createPageButton(1);
      paginationContainer.appendChild(firstBtn);

      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.className = "pagination-ellipsis";
        paginationContainer.appendChild(ellipsis);
      }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = this.createPageButton(i);
      paginationContainer.appendChild(pageBtn);
    }

    // Last page button if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.className = "pagination-ellipsis";
        paginationContainer.appendChild(ellipsis);
      }

      const lastBtn = this.createPageButton(totalPages);
      paginationContainer.appendChild(lastBtn);
    }

    //  FEATURE: Next button
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = this.currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.render();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    paginationContainer.appendChild(nextBtn);
  }

  // ===== CREATE PAGE BUTTON =====
  createPageButton(pageNum) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = pageNum;
    pageBtn.className =
      pageNum === this.currentPage ? "pagination-btn active" : "pagination-btn";
    pageBtn.addEventListener("click", () => {
      this.currentPage = pageNum;
      this.render();
      this.renderPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return pageBtn;
  }

  // ===== GET OPINION BY ID =====
  getOpinionById(id) {
    return this.opinions.find((o) => o.id === id || o.id === String(id));
  }

  // ===== GET TOTAL OPINIONS COUNT =====
  getTotalCount() {
    return this.opinions.length;
  }

  // ===== GET TOTAL VIEWS =====
  getTotalViews() {
    return this.opinions.reduce(
      (total, opinion) => total + (opinion.views || 0),
      0,
    );
  }
}

// ===== INITIALIZE WHEN DOM IS READY =====
let opinionsManager;
document.addEventListener("DOMContentLoaded", () => {
  opinionsManager = new OpinionsPageManager();
  console.log(" OpinionsPageManager initialized (Full Database Integration)");

  //  FEATURE: Expose to window for console access
  window.opinionsManager = opinionsManager;
});

console.log("opinions.js loaded (Database Mode)");
