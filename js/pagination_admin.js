// ===== PAGINATION MANAGER - SUPPORT JOURNALS & OPINIONS =====
class PaginationManager {
  constructor(options = {}) {
    this.containerSelector = options.containerSelector || "#journalContainer";
    this.paginationSelector = options.paginationSelector || "#pagination";
    this.searchInputSelector = options.searchInputSelector || "#searchInput";
    this.sortSelectSelector = options.sortSelectSelector || "#sortSelect";
    this.filterSelectSelector = options.filterSelectSelector || "#filterSelect";

    this.itemsPerPage = options.itemsPerPage || 9;
    this.currentPage = 1;
    this.dataType = options.dataType || "jurnal";

    this.allItems = [];
    this.filteredItems = [];
    this.currentSort = "newest";
    this.currentFilter = "all";

    console.log(
      `📚 PaginationManager initializing for ${this.dataType} (Database Mode)...`,
    );
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupSearch();
    this.setupSort();
    this.setupFilter();
    this.setupIconSort();
    this.applyFiltersAndSort();

    window.addEventListener(`${this.dataType}s:changed`, async () => {
      console.log(`${this.dataType}s changed event received`);
      await this.loadData();
      this.applyFiltersAndSort();
    });

    console.log(
      `PaginationManager initialized with ${this.allItems.length} ${this.dataType}s`,
    );
  }

  // ===== LOAD DATA FROM DATABASE =====
  async loadData() {
    try {
      console.log(`Loading ${this.dataType}s from database...`);

      const timestamp = Date.now();
      const endpoint =
        this.dataType === "jurnal"
          ? `/ksmaja/api/list_journals.php?limit=100&offset=0&t=${timestamp}`
          : `/ksmaja/api/list_opinions.php?limit=100&offset=0&t=${timestamp}`;

      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      const data = await response.json();

      if (data.ok && data.results) {
        this.allItems = data.results.map((item) => this.transformItem(item));
        this.filteredItems = [...this.allItems];

        console.log(
          `Loaded ${this.allItems.length} ${this.dataType}s from database`,
        );
      } else {
        console.warn(`No ${this.dataType}s found in database`);
        this.allItems = [];
        this.filteredItems = [];
      }
    } catch (error) {
      console.error(` Error loading ${this.dataType}s:`, error);

      console.warn("Falling back to localStorage...");
      const storageKey = this.dataType === "jurnal" ? "journals" : "opinions";
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        try {
          this.allItems = JSON.parse(stored);
          this.filteredItems = [...this.allItems];
          console.log(
            `Loaded ${this.allItems.length} ${this.dataType}s from localStorage`,
          );
        } catch (e) {
          console.error("Failed to parse localStorage:", e);
          this.allItems = [];
          this.filteredItems = [];
        }
      } else {
        this.allItems = [];
        this.filteredItems = [];
      }
    }
  }

  // ===== TRANSFORM DATABASE ITEM TO APP FORMAT =====
  transformItem(item) {
    const parseJsonField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        return [];
      }
    };

    if (this.dataType === "jurnal") {
      return {
        id: String(item.id),
        title: item.title || "Untitled",
        abstract: item.abstract || "",
        authors: parseJsonField(item.authors),
        tags: parseJsonField(item.tags),
        pengurus: parseJsonField(item.pengurus),
        date: item.created_at,
        uploadDate: item.created_at,
        fileData: item.file_url,
        file: item.file_url,
        coverImage:
          item.cover_url ||
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
        email: item.email || "",
        contact: item.contact || "",
        volume: item.volume || "",
        views: parseInt(item.views) || 0,
      };
    } else {
      return {
        id: String(item.id),
        title: item.title || "Untitled",
        description: item.description || "",
        category: item.category || "opini",
        author_name: item.author_name || "Anonymous",
        date: item.created_at,
        uploadDate: item.created_at,
        coverImage:
          item.cover_url ||
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
        fileUrl: item.file_url,
        file: item.file_url,
        views: parseInt(item.views) || 0,
        tags: parseJsonField(item.tags),
      };
    }
  }

  // ===== RENDER ITEMS =====
  render() {
    const container = document.querySelector(this.containerSelector);
    if (!container) {
      console.warn("Container not found:", this.containerSelector);
      return;
    }

    container.innerHTML = "";
    this.updateTotalCount();

    if (this.filteredItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">${
            this.dataType === "jurnal" ? "📚" : "📝"
          }</div>
          <h3>Tidak Ada ${this.dataType === "jurnal" ? "Jurnal" : "Opini"}</h3>
          <p>Belum ada ${this.dataType} yang tersedia</p>
        </div>
      `;
      return;
    }

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    const itemsToShow = this.filteredItems.slice(start, end);

    itemsToShow.forEach((item) => {
      const card = this.createCard(item);
      container.appendChild(card);
    });

    this.renderPagination();

    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  // ===== CREATE CARD =====
  createCard(item) {
    const isUserPage =
      window.location.pathname.includes("journals_user") ||
      window.location.pathname.includes("opinions_user");

    const card = document.createElement("div");
    card.className =
      this.dataType === "jurnal" ? "journal-card" : "opinion-card";
    card.setAttribute(`data-${this.dataType}-id`, item.id);

    const truncate = (text, max) => {
      if (!text) return "";
      return text.length > max ? text.substring(0, max) + "..." : text;
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

    if (this.dataType === "jurnal") {
      const author =
        Array.isArray(item.authors) && item.authors.length > 0
          ? item.authors[0]
          : "Unknown";

      const exploreUrl = `explore_jurnal_admin.html?id=${item.id}&type=jurnal`;

      card.innerHTML = `
        <div class="journal-cover" data-explore-url="${exploreUrl}">
          <img src="${item.coverImage}" alt="${item.title}" 
               onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
          <div class="journal-views">
            <i data-feather="eye"></i> ${item.views}
          </div>
        </div>
        <div class="journal-content">
          <h3 class="journal-title">${truncate(item.title, 60)}</h3>
          <p class="journal-abstract">${truncate(item.abstract, 150)}</p>
          <div class="journal-meta">
            <span class="journal-author"><i data-feather="user"></i> ${author}</span>
            <span class="journal-date"><i data-feather="calendar"></i> ${formatDate(
              item.uploadDate,
            )}</span>
          </div>
          ${
            item.tags && item.tags.length > 0
              ? `
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
          `
              : ""
          }
          <div class="journal-actions" style="display:flex; flex-direction:row; gap:6px; margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
  ${
    !isUserPage
      ? `
    <button class="btn-view" onclick="event.stopPropagation(); window.journalManager?.viewJournal('${item.id}')"
      style="flex:1; padding:8px 4px; border:none; background:#3498db; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
      <i data-feather="eye" style="width:13px;height:13px;"></i> Detail
    </button>
    <button class="btn-edit" onclick="event.stopPropagation(); window.editJournalManager?.openEditModal('${item.id}')"
      style="flex:1; padding:8px 4px; border:none; background:#f39c12; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
      <i data-feather="edit" style="width:13px;height:13px;"></i> Edit
    </button>
    <button class="btn-delete" onclick="event.stopPropagation(); window.journalManager?.deleteJournal('${item.id}', '${item.title.replace(/'/g, "\\'")}')"
      style="flex:1; padding:8px 4px; border:none; background:#e74c3c; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
      <i data-feather="trash-2" style="width:13px;height:13px;"></i> Hapus
    </button>
  `
      : ""
  }
  <button class="btn-share" data-journal-id="${item.id}"
    data-journal-title="${item.title}"
    data-journal-url="${exploreUrl}"
    style="flex:1; padding:8px 4px; border:none; background:#2c3e50; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
    <i data-feather="share-2" style="width:13px;height:13px;"></i> Share
  </button>
</div>
      `;

      // Add click handler for cover image
      const coverDiv = card.querySelector(".journal-cover");
      if (coverDiv) {
        coverDiv.addEventListener("click", () => {
          window.location.href = exploreUrl;
        });
      }

      // Add share button handler
      const shareBtn = card.querySelector(".btn-share");
      if (shareBtn) {
        shareBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleShare(item, exploreUrl);
        });
      }
    } else {
      const exploreUrl = `explore_opini_admin.html?id=${item.id}&type=opini`;

      card.innerHTML = `
        <div class="opinion-cover" data-explore-url="${exploreUrl}">
          <img src="${item.coverImage}" alt="${item.title}"
               onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
          <div class="opinion-views">
            <i data-feather="eye"></i> ${item.views}
          </div>
        </div>
        <div class="opinion-content">
          <span class="opinion-category">${item.category}</span>
          <h3 class="opinion-title">${truncate(item.title, 60)}</h3>
          <p class="opinion-description">${truncate(item.description, 150)}</p>
          <div class="opinion-meta">
            <span class="opinion-author"><i data-feather="user"></i> ${
              item.author_name
            }</span>
            <span class="opinion-date"><i data-feather="calendar"></i> ${formatDate(
              item.uploadDate,
            )}</span>
          </div>
          <div class="opinion-tags">
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
          <div class="opinion-actions" style="display:flex; flex-direction:row; gap:6px; margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
  ${
    !isUserPage
      ? `
    <button class="btn-view" onclick="event.stopPropagation(); window.location.href='${exploreUrl}'"
      style="flex:1; padding:8px 4px; border:none; background:#3498db; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
      <i data-feather="eye" style="width:13px;height:13px;"></i> Detail
    </button>
    <button class="btn-edit" onclick="event.stopPropagation(); window.openEditOpinionModal('${item.id}')"
      style="flex:1; padding:8px 4px; border:none; background:#f39c12; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
      <i data-feather="edit" style="width:13px;height:13px;"></i> Edit
    </button>
    <button class="btn-delete" onclick="event.stopPropagation(); window.deleteOpinion('${item.id}', '${item.title.replace(/'/g, "\\'")}')"
      style="flex:1; padding:8px 4px; border:none; background:#e74c3c; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
      <i data-feather="trash-2" style="width:13px;height:13px;"></i> Hapus
    </button>
  `
      : ""
  }
  <button class="btn-share" data-opinion-id="${item.id}"
    style="flex:1; padding:8px 4px; border:none; background:#2c3e50; color:white; border-radius:4px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-size:12px;">
    <i data-feather="share-2" style="width:13px;height:13px;"></i> Share
  </button>
</div>
      `;

      // Add click handler for cover image
      const coverDiv = card.querySelector(".opinion-cover");
      if (coverDiv) {
        coverDiv.addEventListener("click", () => {
          window.location.href = exploreUrl;
        });
      }

      // Add share button handler
      const shareBtn = card.querySelector(".btn-share");
      if (shareBtn) {
        shareBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.handleShare(item, exploreUrl);
        });
      }
    }

    return card;
  }

  // ===== HANDLE SHARE =====
  handleShare(item, url) {
    const fullUrl = window.location.origin + "/" + url;
    const shareText = `Lihat ${this.dataType}: ${item.title}`;

    // Try native share API first (mobile)
    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: shareText,
          url: fullUrl,
        })
        .then(() => console.log("Shared successfully"))
        .catch((error) => {
          if (error.name !== "AbortError") {
            this.fallbackShare(fullUrl, shareText);
          }
        });
    } else {
      // Fallback to copy to clipboard
      this.fallbackShare(fullUrl, shareText);
    }
  }

  fallbackShare(url, text) {
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          alert("Link berhasil disalin ke clipboard! 📋");
        })
        .catch(() => {
          this.legacyCopy(url);
        });
    } else {
      this.legacyCopy(url);
    }
  }

  legacyCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      alert("Link berhasil disalin! 📋");
    } catch (err) {
      prompt("Copy link ini:", text);
    }

    document.body.removeChild(textarea);
  }

  // ===== RENDER PAGINATION =====
  renderPagination() {
    const paginationContainer = document.querySelector(this.paginationSelector);
    if (!paginationContainer) return;

    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);

    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    paginationContainer.innerHTML = "";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
    paginationContainer.appendChild(prevBtn);

    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

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

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = this.createPageButton(i);
      paginationContainer.appendChild(pageBtn);
    }

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

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "pagination-btn";
    nextBtn.disabled = this.currentPage === totalPages;
    nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
    paginationContainer.appendChild(nextBtn);
  }

  createPageButton(pageNum) {
    const btn = document.createElement("button");
    btn.textContent = pageNum;
    btn.className =
      pageNum === this.currentPage ? "pagination-btn active" : "pagination-btn";
    btn.onclick = () => this.goToPage(pageNum);
    return btn;
  }

  goToPage(pageNum) {
    this.currentPage = pageNum;
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateTotalCount() {
    const possibleIds = ["totalJournals", "totalOpinions", "totalCount"];

    for (const id of possibleIds) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = this.filteredItems.length;
        console.log(
          ` Total count updated (${id}): ${this.filteredItems.length}`,
        );
        return;
      }
    }

    console.warn("⚠️ Total count element not found");
  }

  setupSearch() {
    const searchInput = document.querySelector(this.searchInputSelector);
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      this.applyFiltersAndSort(query);
    });
  }

  setupSort() {
    const sortSelect = document.querySelector(this.sortSelectSelector);
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentSort = e.target.value;
        this.applyFiltersAndSort();
      });
    }

    window.addEventListener("sortChanged", (e) => {
      this.currentSort = e.detail.sortValue;
      this.applyFiltersAndSort();
    });
  }

  setupFilter() {
    const filterSelect = document.querySelector(this.filterSelectSelector);
    if (!filterSelect) return;

    filterSelect.addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.applyFiltersAndSort();
    });
  }

  setupIconSort() {
    const btnSort = document.getElementById("btnSort");
    const sortMenu = document.getElementById("sortMenu");
    const sortItems = document.querySelectorAll(".sort-item");
    const dropdown = document.querySelector(".sort-dropdown");

    if (!btnSort || !sortMenu) {
      console.log("⚠️ Icon sort dropdown not found, skipping...");
      return;
    }

    btnSort.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });

    sortItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const sortValue = e.currentTarget.dataset.sort;

        sortItems.forEach((i) => i.classList.remove("active"));
        e.currentTarget.classList.add("active");

        dropdown.classList.remove("active");

        this.currentSort = sortValue;
        this.applyFiltersAndSort();

        console.log(` Sort changed to: ${sortValue}`);
      });
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });

    console.log(" Icon sort dropdown initialized");
  }

  applyFiltersAndSort(searchQuery = null) {
    let items = [...this.allItems];

    const query =
      searchQuery !== null
        ? searchQuery
        : document
            .querySelector(this.searchInputSelector)
            ?.value.toLowerCase()
            .trim() || "";

    if (query) {
      items = items.filter((item) => {
        if (this.dataType === "jurnal") {
          return (
            item.title.toLowerCase().includes(query) ||
            item.abstract.toLowerCase().includes(query) ||
            (Array.isArray(item.authors) &&
              item.authors.some((a) => a.toLowerCase().includes(query))) ||
            (Array.isArray(item.tags) &&
              item.tags.some((t) => t.toLowerCase().includes(query)))
          );
        } else {
          return (
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.author_name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
          );
        }
      });
    }

    if (this.currentFilter !== "all") {
      items = items.filter((item) => {
        if (this.dataType === "jurnal") {
          return (
            Array.isArray(item.tags) && item.tags.includes(this.currentFilter)
          );
        } else {
          return item.category === this.currentFilter;
        }
      });
    }

    if (this.currentSort === "newest") {
      items.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    } else if (this.currentSort === "oldest") {
      items.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
    } else if (this.currentSort === "title") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.currentSort === "views") {
      items.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    this.filteredItems = items;
    this.currentPage = 1;
    this.render();
  }
}

// ===== AUTO-INITIALIZE =====
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const isAdminPage =
    path.includes("journals.html") ||
    path.includes("opinions.html") ||
    path.includes("dashboard_admin.html");
  if (isAdminPage) return;

  const container = document.getElementById("journalContainer");
  if (!container) return;

  const isOpinionsPage = path.includes("opinions_user");
  const dataType = isOpinionsPage ? "opini" : "jurnal";

  window.paginationManager = new PaginationManager({
    containerSelector: "#journalContainer",
    paginationSelector: "#pagination",
    searchInputSelector: "#searchInput",
    sortSelectSelector: "#sortSelect",
    filterSelectSelector: "#filterSelect",
    itemsPerPage: 9,
    dataType: dataType,
  });
});

console.log("pagination.js loaded (Support Journals & Opinions + Share)");
