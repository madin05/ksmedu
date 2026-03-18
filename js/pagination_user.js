// ===== PAGINATION USER - journals_user.html & opinions_user.html =====
// User-only: Share button saja, tidak ada Edit/Hapus/Detail admin
// Self-init via DOMContentLoaded

class PaginationUser {
  constructor(options = {}) {
    this.containerSelector = options.containerSelector || "#journalContainer";
    this.paginationSelector = options.paginationSelector || "#pagination";
    this.searchInputSelector = options.searchInputSelector || "#searchInput";
    this.itemsPerPage = options.itemsPerPage || 9;
    this.dataType = options.dataType || "jurnal";
    this.currentPage = 1;
    this.allItems = [];
    this.filteredItems = [];
    this.currentSort = "newest";
    this.searchQuery = "";

    console.log(`PaginationUser init: ${this.dataType}`);
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupSearch();
    this.setupIconSort();
    this.applyFiltersAndSort();

    const eventName = this.dataType === "jurnal" ? "journals:changed" : "opinions:changed";
    window.addEventListener(eventName, async () => {
      console.log(`PaginationUser catch event: ${eventName}`);
      await this.loadData();
      this.applyFiltersAndSort();
    });
  }

  // ===== LOAD DATA =====
  async loadData() {
    this.showSkeleton();
    try {
      const t = Date.now();
      const endpoint =
        this.dataType === "jurnal"
          ? `/ksmaja/api/list_journals.php?limit=100&offset=0&t=${t}`
          : `/ksmaja/api/list_opinions.php?limit=100&offset=0&t=${t}`;

      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();

      if (data.ok && data.results) {
        this.allItems = data.results.map((item) => this.transform(item));
      } else {
        this.allItems = [];
      }
    } catch (err) {
      console.error("Load error:", err);
      this.allItems = [];
    }
  }

  // ===== TRANSFORM =====
  transform(item) {
    const parseJson = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    };

    if (this.dataType === "jurnal") {
      return {
        id: String(item.id),
        title: item.title || "Untitled",
        abstract: item.abstract || "",
        authors: parseJson(item.authors),
        tags: parseJson(item.tags),
        uploadDate: item.created_at,
        coverImage:
          item.cover_url ||
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
        views: parseInt(item.views) || 0,
      };
    } else {
      return {
        id: String(item.id),
        title: item.title || "Untitled",
        description: item.description || "",
        category: item.category || "opini",
        author_name: item.author_name || "Anonymous",
        tags: parseJson(item.tags),
        uploadDate: item.created_at,
        coverImage:
          item.cover_url ||
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
        views: parseInt(item.views) || 0,
      };
    }
  }

  showSkeleton() {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    container.innerHTML = "";
    const count = this.dataType === "jurnal" ? 6 : 6; // default skeletons

    for (let i = 0; i < count; i++) {
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

  // ===== RENDER =====
  render() {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    container.innerHTML = "";
    this.updateCount();

    if (this.filteredItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"></div>
          <h3>Tidak Ada ${this.dataType === "jurnal" ? "Jurnal" : "Opini"}</h3>
          <p>Belum ada artikel yang tersedia</p>
        </div>`;
      return;
    }

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const items = this.filteredItems.slice(start, start + this.itemsPerPage);
    items.forEach((item) => container.appendChild(this.createCard(item)));

    this.renderPagination();
    if (typeof feather !== "undefined") feather.replace();
  }

  // ===== CREATE CARD (user - share only) =====
  createCard(item) {
    const card = document.createElement("div");
    card.className =
      this.dataType === "jurnal" ? "journal-card" : "opinion-card";
    card.setAttribute(`data-${this.dataType}-id`, item.id);

    const truncate = (text, max) =>
      !text ? "" : text.length > max ? text.substring(0, max) + "..." : text;

    const formatDate = (d) => {
      try {
        return new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return d;
      }
    };

    const exploreUrl =
      this.dataType === "jurnal"
        ? `explore_jurnal_user.html?id=${item.id}&type=jurnal`
        : `explore_opini_user.html?id=${item.id}&type=opini`;

    const tags = Array.isArray(item.tags) ? item.tags : [];

    if (this.dataType === "jurnal") {
      const author =
        Array.isArray(item.authors) && item.authors.length > 0
          ? item.authors[0]
          : "Unknown";
      card.innerHTML = `
        <div class="journal-cover" style="cursor:pointer;">
          <img src="${item.coverImage}" alt="${item.title}"
               onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
          <div class="journal-views"><i data-feather="eye"></i> ${item.views}</div>
        </div>
        <div class="journal-content">
          <h3 class="journal-title">${truncate(item.title, 60)}</h3>
          <p class="journal-abstract">${truncate(item.abstract, 150)}</p>
          <div class="journal-meta">
            <span class="journal-author"><i data-feather="user"></i> ${author}</span>
            <span class="journal-date"><i data-feather="calendar"></i> ${formatDate(item.uploadDate)}</span>
          </div>
          ${
            tags.length > 0
              ? `
            <div class="journal-tags">
              ${tags
                .slice(0, 3)
                .map((t) => `<span class="tag">${t}</span>`)
                .join("")}
              ${tags.length > 3 ? `<span class="tag-more">+${tags.length - 3}</span>` : ""}
            </div>`
              : ""
          }
          <div class="journal-actions" style="margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
            <button class="btn-share">
              <i data-feather="share-2" style="width:14px;height:14px;"></i> SHARE
            </button>
          </div>
        </div>`;
    } else {
      card.innerHTML = `
        <div class="opinion-cover" style="cursor:pointer;">
          <img src="${item.coverImage}" alt="${item.title}"
               onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
          <div class="opinion-views"><i data-feather="eye"></i> ${item.views}</div>
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
            tags.length > 0
              ? `
            <div class="opinion-tags">
              ${tags
                .slice(0, 3)
                .map((t) => `<span class="tag">${t}</span>`)
                .join("")}
              ${tags.length > 3 ? `<span class="tag-more">+${tags.length - 3}</span>` : ""}
            </div>`
              : ""
          }
          <div class="opinion-actions" style="margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
            <button class="btn-share">
              <i data-feather="share-2" style="width:14px;height:14px;"></i> SHARE
            </button>
          </div>
        </div>`;
    }

    // Cover click - explore
    const cover = card.querySelector(".journal-cover, .opinion-cover");
    if (cover) {
      cover.addEventListener("click", () => (window.location.href = exploreUrl));
    }

    // Share button
    const shareBtn = card.querySelector(".btn-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.handleShare(item, exploreUrl);
      });
    }

    return card;
  }

  // ===== SHARE =====
  handleShare(item, url) {
    const fullUrl = window.location.origin + "/" + url;
    this.copyToClipboard(fullUrl, item.title);
  }

  copyToClipboard(url, title = "") {
    const notify = (msg, subMsg = "") => {
      if (typeof showToast === "function") {
        showToast(subMsg ? `"${subMsg}"` : "", "success", msg);
      } else {
        alert(msg + (subMsg ? "\n" + subMsg : ""));
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => notify("Link berhasil disalin!", title));
    } else {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0;";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        notify("Link berhasil disalin!", title);
      } catch {
        prompt("Copy link ini:", url);
      }
      document.body.removeChild(ta);
    }
  }

  // ===== SEARCH =====
  setupSearch() {
    const input = document.querySelector(this.searchInputSelector);
    if (!input) return;

    input.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.currentPage = 1;
      this.applyFiltersAndSort();
    });
  }

  // ===== ICON SORT =====
  setupIconSort() {
    const btnSort = document.getElementById("btnSort");
    const sortMenu = document.getElementById("sortMenu");
    const dropdown = document.querySelector(".sort-dropdown");
    const sortItems = document.querySelectorAll(".sort-item");

    if (!btnSort || !sortMenu) return;

    btnSort.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });

    sortItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        this.currentSort = e.currentTarget.dataset.sort;
        sortItems.forEach((i) => i.classList.remove("active"));
        e.currentTarget.classList.add("active");
        dropdown.classList.remove("active");
        this.currentPage = 1;
        this.applyFiltersAndSort();
      });
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove("active");
    });
  }

  // ===== APPLY SEARCH + SORT (single pipeline) =====
  applyFiltersAndSort() {
    // 1. Start from all items
    let items = [...this.allItems];

    // 2. Apply search filter
    const query = this.searchQuery;
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
            (item.author_name || "").toLowerCase().includes(query)
          );
        }
      });
    }

    // 3. Apply sort
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
    this.render();
  }

  // ===== UPDATE COUNT =====
  updateCount() {
    const ids = ["totalJournals", "totalOpinions", "totalCount"];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = this.filteredItems.length;
        return;
      }
    }
  }

  // ===== PAGINATION =====
  renderPagination() {
    const container = document.querySelector(this.paginationSelector);
    if (!container) return;

    const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = "";

    // Previous
    const prev = document.createElement("button");
    prev.textContent = "Previous";
    prev.className = "pagination-btn";
    prev.disabled = this.currentPage === 1;
    prev.onclick = () => this.goToPage(this.currentPage - 1);
    container.appendChild(prev);

    // Page numbers with ellipsis
    const max = 5;
    let start = Math.max(1, this.currentPage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);

    if (start > 1) {
      container.appendChild(this.pageBtn(1));
      if (start > 2) {
        const e = document.createElement("span");
        e.textContent = "...";
        e.className = "pagination-ellipsis";
        container.appendChild(e);
      }
    }
    for (let i = start; i <= end; i++) container.appendChild(this.pageBtn(i));
    if (end < totalPages) {
      if (end < totalPages - 1) {
        const e = document.createElement("span");
        e.textContent = "...";
        e.className = "pagination-ellipsis";
        container.appendChild(e);
      }
      container.appendChild(this.pageBtn(totalPages));
    }

    // Next
    const next = document.createElement("button");
    next.textContent = "Next";
    next.className = "pagination-btn";
    next.disabled = this.currentPage === totalPages;
    next.onclick = () => this.goToPage(this.currentPage + 1);
    container.appendChild(next);
  }

  pageBtn(num) {
    const btn = document.createElement("button");
    btn.textContent = num;
    btn.className =
      num === this.currentPage ? "pagination-btn active" : "pagination-btn";
    btn.onclick = () => this.goToPage(num);
    return btn;
  }

  goToPage(num) {
    this.currentPage = num;
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ===== AUTO INIT - user pages only =====
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("journalContainer");
  if (!container) return;

  const path = window.location.pathname;
  const dataType = path.includes("opinions_user") ? "opini" : "jurnal";

  window.paginationUser = new PaginationUser({
    containerSelector: "#journalContainer",
    paginationSelector: "#pagination",
    searchInputSelector: "#searchInput",
    itemsPerPage: 9,
    dataType: dataType,
  });
});

console.log("pagination_user.js loaded");
