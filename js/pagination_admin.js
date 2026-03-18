// ===== PAGINATION ADMIN - journals.html & opinions.html =====
// Admin-only: dropdown menu (Detail, Edit, Hapus, Share)
// Diinit oleh script.js, BUKAN auto-init

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

    console.log(`PaginationManager init: ${this.dataType}`);
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
      await this.loadData();
      this.applyFiltersAndSort();
    });
  }

  // ===== LOAD DATA FROM DATABASE =====
  async loadData() {
    this.showSkeleton();
    try {
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
      } else {
        this.allItems = [];
        this.filteredItems = [];
      }
    } catch (error) {
      console.error(`Error loading ${this.dataType}s:`, error);
      this.allItems = [];
      this.filteredItems = [];
    }
  }

  // ===== TRANSFORM DATABASE ITEM =====
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

  showSkeleton() {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    container.innerHTML = "";
    for (let i = 0; i < 6; i++) {
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
      container.appendChild(skeleton);
    }
  }

  // ===== RENDER ITEMS =====
  render() {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    container.innerHTML = "";
    this.updateTotalCount();

    if (this.filteredItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"></div>
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

  // ===== CREATE CARD (ADMIN - dropdown menu) =====
  createCard(item) {
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

    const safeTitle = item.title.replace(/'/g, "\\'");

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
          <div class="card-type-badge badge-jurnal">JURNAL</div>
        </div>
        <div class="journal-content">
          <h3 class="journal-title">${truncate(item.title, 60)}</h3>
          <p class="journal-abstract">${truncate(item.abstract, 150)}</p>
          <div class="journal-meta">
            <span class="journal-author"><i data-feather="user"></i> ${author}</span>
            <span class="journal-date"><i data-feather="calendar"></i> ${formatDate(item.uploadDate)}</span>
          </div>
          ${
            item.tags && item.tags.length > 0
              ? `
            <div class="journal-tags">
              ${item.tags
                .slice(0, 3)
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
              ${item.tags.length > 3 ? `<span class="tag-more">+${item.tags.length - 3}</span>` : ""}
            </div>
          `
              : ""
          }
          <div class="journal-actions" style="display: flex !important; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <div class="dropdown-menu-container" style="position: relative;">
              <button class="dropdown-toggle" onclick="event.stopPropagation(); togglePaginationDropdown('jurnal-${item.id}')" style="background: none; border: none; cursor: pointer; padding: 6px; border-radius: 50%; transition: background 0.2s; color: #666;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
                <i data-feather="more-vertical" style="width: 20px; height: 20px;"></i>
              </button>
              <div id="pg-dropdown-jurnal-${item.id}" class="dropdown-content" style="display: none; position: absolute; right: 0; bottom: 100%; background: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 1000; min-width: 140px; padding: 4px 0; margin-bottom: 4px;">
                <button onclick="event.stopPropagation(); window.journalManager?.viewJournal('${item.id}'); closePaginationDropdown('jurnal-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #3498db; font-size: 13px;">
                  <i data-feather="eye" style="width:14px; height:14px;"></i> Detail
                </button>
                <button onclick="event.stopPropagation(); window.editJournalManager?.openEditModal('${item.id}'); closePaginationDropdown('jurnal-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #f39c12; font-size: 13px;">
                  <i data-feather="edit" style="width:14px; height:14px;"></i> Edit
                </button>
                <button onclick="event.stopPropagation(); window.journalManager?.deleteJournal('${item.id}', '${safeTitle}'); closePaginationDropdown('jurnal-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #e74c3c; font-size: 13px;">
                  <i data-feather="trash-2" style="width:14px; height:14px;"></i> Hapus
                </button>
                <button onclick="event.stopPropagation(); openShareModal('${item.id}'); closePaginationDropdown('jurnal-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #27ae60; font-size: 13px;">
                  <i data-feather="share-2" style="width:14px; height:14px;"></i> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Cover click → explore
      const coverDiv = card.querySelector(".journal-cover");
      if (coverDiv) {
        coverDiv.style.cursor = "pointer";
        coverDiv.addEventListener("click", () => {
          window.location.href = exploreUrl;
        });
      }
    } else {
      // ===== OPINI CARD =====
      const exploreUrl = `explore_opini_admin.html?id=${item.id}&type=opini`;

      card.innerHTML = `
        <div class="opinion-cover" data-explore-url="${exploreUrl}">
          <img src="${item.coverImage}" alt="${item.title}"
               onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
          <div class="opinion-views">
            <i data-feather="eye"></i> ${item.views}
          </div>
          <div class="card-type-badge badge-opini">OPINI</div>
        </div>
        <div class="opinion-content">
          <span class="opinion-category">${item.category}</span>
          <h3 class="opinion-title">${truncate(item.title, 60)}</h3>
          <p class="opinion-description">${truncate(item.description, 150)}</p>
          <div class="opinion-meta">
            <span class="opinion-author"><i data-feather="user"></i> ${item.author_name}</span>
            <span class="opinion-date"><i data-feather="calendar"></i> ${formatDate(item.uploadDate)}</span>
          </div>
          ${
            item.tags && item.tags.length > 0
              ? `
            <div class="opinion-tags">
              ${item.tags
                .slice(0, 3)
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
              ${item.tags.length > 3 ? `<span class="tag-more">+${item.tags.length - 3}</span>` : ""}
            </div>
          `
              : ""
          }
          <div class="opinion-actions" style="display: flex !important; justify-content: flex-end; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
            <div class="dropdown-menu-container" style="position: relative;">
              <button class="dropdown-toggle" onclick="event.stopPropagation(); togglePaginationDropdown('opini-${item.id}')" style="background: none; border: none; cursor: pointer; padding: 6px; border-radius: 50%; transition: background 0.2s; color: #666;" onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
                <i data-feather="more-vertical" style="width: 20px; height: 20px;"></i>
              </button>
              <div id="pg-dropdown-opini-${item.id}" class="dropdown-content" style="display: none; position: absolute; right: 0; bottom: 100%; background: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 1000; min-width: 140px; padding: 4px 0; margin-bottom: 4px;">
                <button onclick="event.stopPropagation(); window.location.href='${exploreUrl}'; closePaginationDropdown('opini-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #3498db; font-size: 13px;">
                  <i data-feather="eye" style="width:14px; height:14px;"></i> Detail
                </button>
                <button onclick="event.stopPropagation(); window.openEditOpinionModal('${item.id}'); closePaginationDropdown('opini-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #f39c12; font-size: 13px;">
                  <i data-feather="edit" style="width:14px; height:14px;"></i> Edit
                </button>
                <button onclick="event.stopPropagation(); window.deleteOpinion('${item.id}', '${safeTitle}'); closePaginationDropdown('opini-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #e74c3c; font-size: 13px;">
                  <i data-feather="trash-2" style="width:14px; height:14px;"></i> Hapus
                </button>
                <button onclick="event.stopPropagation(); openShareModal('${item.id}'); closePaginationDropdown('opini-${item.id}')" style="width: 100%; padding: 8px 12px; border: none; background: none; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 8px; color: #27ae60; font-size: 13px;">
                  <i data-feather="share-2" style="width:14px; height:14px;"></i> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Cover click → explore
      const coverDiv = card.querySelector(".opinion-cover");
      if (coverDiv) {
        coverDiv.style.cursor = "pointer";
        coverDiv.addEventListener("click", () => {
          window.location.href = exploreUrl;
        });
      }
    }

    return card;
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

    // Previous button
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous";
    prevBtn.className = "pagination-btn";
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
    paginationContainer.appendChild(prevBtn);

    // Page numbers with ellipsis
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      paginationContainer.appendChild(this.createPageButton(1));
      if (startPage > 2) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.className = "pagination-ellipsis";
        paginationContainer.appendChild(ellipsis);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationContainer.appendChild(this.createPageButton(i));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const ellipsis = document.createElement("span");
        ellipsis.textContent = "...";
        ellipsis.className = "pagination-ellipsis";
        paginationContainer.appendChild(ellipsis);
      }
      paginationContainer.appendChild(this.createPageButton(totalPages));
    }

    // Next button
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

  // ===== UPDATE TOTAL COUNT =====
  updateTotalCount() {
    const possibleIds = ["totalJournals", "totalOpinions", "totalCount"];
    for (const id of possibleIds) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = this.filteredItems.length;
        return;
      }
    }
  }

  // ===== SEARCH =====
  setupSearch() {
    const searchInput = document.querySelector(this.searchInputSelector);
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      this.applyFiltersAndSort(query);
    });
  }

  // ===== SORT (select dropdown) =====
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

  // ===== FILTER =====
  setupFilter() {
    const filterSelect = document.querySelector(this.filterSelectSelector);
    if (!filterSelect) return;

    filterSelect.addEventListener("change", (e) => {
      this.currentFilter = e.target.value;
      this.applyFiltersAndSort();
    });
  }

  // ===== ICON SORT (button dropdown) =====
  setupIconSort() {
    const btnSort = document.getElementById("btnSort");
    const sortMenu = document.getElementById("sortMenu");
    const sortItems = document.querySelectorAll(".sort-item");
    const dropdown = document.querySelector(".sort-dropdown");

    if (!btnSort || !sortMenu) return;

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
      });
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  }

  // ===== APPLY FILTERS, SEARCH & SORT =====
  applyFiltersAndSort(searchQuery = null) {
    let items = [...this.allItems];

    // Search
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
            (item.description || "").toLowerCase().includes(query) ||
            (item.author_name || "").toLowerCase().includes(query) ||
            (item.category || "").toLowerCase().includes(query)
          );
        }
      });
    }

    // Filter
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

    // Sort
    switch (this.currentSort) {
      case "newest":
        items.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        break;
      case "oldest":
        items.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
        break;
      case "title":
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "views":
        items.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }

    this.filteredItems = items;
    this.currentPage = 1;
    this.render();
  }

  // ===== GET ITEM BY ID (untuk social.js share modal) =====
  getItemById(id) {
    return this.allItems.find((item) => item.id === String(id));
  }
}

// ===== DROPDOWN FUNCTIONS FOR PAGINATION ADMIN =====
function togglePaginationDropdown(key) {
  const dropdown = document.getElementById(`pg-dropdown-${key}`);
  if (!dropdown) return;

  const isVisible = dropdown.style.display === "block";

  // Close all pagination dropdowns first
  document.querySelectorAll('[id^="pg-dropdown-"]').forEach((d) => {
    d.style.display = "none";
  });

  // Toggle current
  dropdown.style.display = isVisible ? "none" : "block";

  // Close on outside click
  if (!isVisible) {
    const closeHandler = (e) => {
      if (
        !dropdown.contains(e.target) &&
        !e.target.closest(".dropdown-toggle")
      ) {
        dropdown.style.display = "none";
        document.removeEventListener("click", closeHandler);
      }
    };
    document.addEventListener("click", closeHandler);
  }
}

function closePaginationDropdown(key) {
  const dropdown = document.getElementById(`pg-dropdown-${key}`);
  if (dropdown) dropdown.style.display = "none";
}

console.log("pagination_admin.js loaded");
