// ===== PAGINATION USER - journals_user.php & opinions_user.php =====
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
    const urlParams = new URLSearchParams(window.location.search);
    this.searchQuery = urlParams.get("search") || "";

    console.log(`PaginationUser init: ${this.dataType}`);
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupSearch();
    this.setupIconSort();
    this.applyFiltersAndSort();

    const eventName =
      this.dataType === "jurnal" ? "journals:changed" : "opinions:changed";
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
          ? `${window.APP_CONFIG.apiBase}/list_journals.php?limit=100&offset=0&t=${t}`
          : `${window.APP_CONFIG.apiBase}/list_opinions.php?limit=100&offset=0&t=${t}`;

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
        file_url: item.file_url,
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
        file_url: item.file_url,
        views: parseInt(item.views) || 0,
      };
    }
  }

  showSkeleton() {
    const container = document.querySelector(this.containerSelector);
    if (!container) return;

    container.innerHTML = "";
    const isListView = container.classList.contains("list-view");
    const count = 6;

    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement("div");
      
      if (isListView) {
        skeleton.className = "skeleton-list";
        skeleton.innerHTML = `
          <div class="skeleton-list-thumb skeleton"></div>
          <div class="skeleton-list-content">
            <div class="skeleton-title medium skeleton"></div>
            <div class="skeleton-text skeleton"></div>
            <div class="skeleton-text skeleton"></div>
            <div class="skeleton-text short skeleton"></div>
            <div class="skeleton-meta" style="margin-top: auto;">
              <div class="skeleton-text short skeleton"></div>
            </div>
          </div>
        `;
      } else {
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
      }
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

  // ===== CREATE CARD (user - download & share dropdown menu) =====
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
        ? `explore_jurnal_user.php?id=${item.id}&type=jurnal`
        : `explore_opini_user.php?id=${item.id}&type=opini`;

    const tags = Array.isArray(item.tags) ? item.tags : [];
    const dropdownId = `user-dropdown-${this.dataType}-${item.id}`;

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
          <div class="card-actions">
            <div class="dropdown-menu-container">
              <button class="dropdown-toggle" onclick="event.stopPropagation(); window.paginationUser?.toggleUserDropdown('${dropdownId}')">
                <i data-feather="more-vertical"></i>
              </button>
              <div id="${dropdownId}" class="dropdown-content">
                <button class="dropdown-item-btn dd-download" onclick="event.stopPropagation(); window.paginationUser?.downloadFile('${item.file_url || ''}', '${item.title.replace(/'/g, "\\'")}', '${this.dataType}', '${item.id}')">
                  <i data-feather="download"></i> Download
                </button>
                <button class="dropdown-item-btn dd-share" onclick="event.stopPropagation(); window.paginationUser?.copyToClipboard('${window.location.origin + window.APP_CONFIG.ROOT + "/" + exploreUrl}', '${item.title.replace(/'/g, "\\'")}')">
                  <i data-feather="share-2"></i> Share
                </button>
              </div>
            </div>
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
          <div class="card-actions">
            <div class="dropdown-menu-container">
              <button class="dropdown-toggle" onclick="event.stopPropagation(); window.paginationUser?.toggleUserDropdown('${dropdownId}')">
                <i data-feather="more-vertical"></i>
              </button>
              <div id="${dropdownId}" class="dropdown-content">
                <button class="dropdown-item-btn dd-download" onclick="event.stopPropagation(); window.paginationUser?.downloadFile('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${this.dataType}')">
                  <i data-feather="download"></i> Download
                </button>
                <button class="dropdown-item-btn dd-share" onclick="event.stopPropagation(); window.paginationUser?.openShareModal('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${exploreUrl}')">
                  <i data-feather="share-2"></i> Share
                </button>
              </div>
            </div>
          </div>
        </div>`;
    }

    // Card click - explore (except dropdown clicks)
    card.style.cursor = "pointer";
    card.addEventListener("click", (e) => {
      if (e.target.closest(".dropdown-menu-container")) {
        return;
      }
      window.location.href = exploreUrl;
    });

    return card;
  }

  // ===== TOGGLE DROPDOWN =====
  toggleUserDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    // Close all other dropdowns
    document.querySelectorAll(".dropdown-content").forEach((el) => {
      if (el.id !== dropdownId) el.style.display = "none";
    });

    // Toggle current
    dropdown.style.display =
      dropdown.style.display === "none" ? "block" : "none";
  }

  // ===== DOWNLOAD FILE =====
  async downloadFile(fileUrlOrId, itemTitle, dataType, itemId) {
    try {
      let fileUrl = fileUrlOrId;

      // Fallback jika hanya ID yang dikirim
      if (!fileUrl || (!fileUrl.includes("/") && !fileUrl.includes("http"))) {
        const id = fileUrlOrId || itemId;
        const endpoint =
          dataType === "jurnal"
            ? `${window.APP_CONFIG.apiBase}/get_journal.php?id=${id}`
            : `${window.APP_CONFIG.apiBase}/get_opinion.php?id=${id}`;

        console.log("Fetching file URL from API:", endpoint);
        const response = await fetch(endpoint);
        const data = await response.json();

        if (!data.ok) {
          showAlert.error(
            data.message || "File tidak ditemukan!",
            "Download Gagal",
          );
          return;
        }
        fileUrl = data.data?.file_url || data.file_url || data.fileUrl;
      }

      if (!fileUrl) {
        showAlert.error("File tidak ditemukan!", "Download Gagal");
        return;
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = itemTitle + ".pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();

      // Small delay before removing to ensure download starts
      setTimeout(() => document.body.removeChild(link), 100);

      if (typeof showToast === "function") {
        showToast(`${itemTitle}.pdf berhasil diunduh!`, "success", "Download Sukses");
      } else {
        showAlert.success(
          `${itemTitle}.pdf berhasil diunduh!`,
          "Download Sukses",
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      showAlert.error(
        "Gagal download file: " + error.message,
        "Download Gagal",
      );
    }

    // Close dropdown
    document.querySelectorAll(".dropdown-content").forEach((el) => {
      el.style.display = "none";
    });
  }

  // ===== OPEN SHARE MODAL WITH OPTIONS =====
  openShareModal(itemId, itemTitle, pageUrl) {
    const baseUrl = window.location.origin + window.APP_CONFIG.ROOT + "/";
    const fullShareUrl = baseUrl + pageUrl;

    // Create temporary modal if not exists
    let modal = document.getElementById("userShareModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "userShareModal";
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-overlay" onclick="document.getElementById('userShareModal').style.display='none'"></div>
          <div class="modal-content" style="max-width: 400px">
            <button type="button" class="close-modal" onclick="document.getElementById('userShareModal').style.display='none'">
              <i data-feather="x"></i>
            </button>
            <h2 style="margin-bottom: 20px">Bagikan ${itemTitle}</h2>
            <div style="display: flex; flex-direction: column; gap: 12px">
              <input
                type="text"
                id="shareUrlInput"
                value="${fullShareUrl}"
                readonly
                style="
                  padding: 12px;
                  border: 1px solid #ddd;
                  border-radius: 6px;
                  font-size: 14px;
                "
              />
              <button onclick="window.paginationUser?.copyLink()" class="share-btn-modal copy">
                <i data-feather="copy"></i> Copy Link
              </button>
              <button onclick="window.paginationUser?.shareToWhatsApp('${fullShareUrl}', '${itemTitle}')" class="share-btn-modal wa">
                <i data-feather="message-circle"></i> WhatsApp
              </button>
              <button onclick="window.paginationUser?.shareToFacebook('${fullShareUrl}')" class="share-btn-modal fb">
                <i data-feather="facebook"></i> Facebook
              </button>
              <button onclick="window.paginationUser?.shareToTwitter('${fullShareUrl}', '${itemTitle}')" class="share-btn-modal x">
                <i data-feather="x"></i> Twitter / X
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      // Update URL in existing modal
      modal.querySelector("#shareUrlInput").value = fullShareUrl;
    }

    modal.style.display = "block";
    if (typeof feather !== "undefined") feather.replace();

    // Close dropdown
    document.querySelectorAll(".dropdown-content").forEach((el) => {
      el.style.display = "none";
    });
  }

  // ===== COPY LINK =====
  copyLink() {
    const input = document.getElementById("shareUrlInput");
    if (!input || !input.value) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(input.value)
        .then(() => {
          showAlert.success("Link berhasil disalin ke clipboard!", "Informasi");
        })
        .catch(() => {
          showAlert.error("Gagal menyalin link", "Error");
        });
    } else {
      input.select();
      try {
        document.execCommand("copy");
        showAlert.success("Link berhasil disalin ke clipboard!", "Informasi");
      } catch (e) {
        console.error("Copy error:", e);
        showAlert.error("Gagal menyalin link", "Error");
      }
    }
  }

  // ===== SHARE TO WHATSAPP =====
  shareToWhatsApp(url, title) {
    const text = `Cek artikel "${title}" di sini: ${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    showAlert.success("Membuka WhatsApp...", "Informasi");
    setTimeout(() => window.open(whatsappUrl, "_blank"), 300);
  }

  // ===== SHARE TO FACEBOOK =====
  shareToFacebook(url) {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=Cek%20artikel%20ini`;
    showAlert.success("Membuka Facebook...", "Informasi");
    setTimeout(
      () => window.open(facebookUrl, "_blank", "width=600,height=400"),
      300,
    );
  }

  // ===== SHARE TO TWITTER/X =====
  shareToTwitter(url, title) {
    const text = `Cek artikel "${title}" di KSM Education`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    showAlert.success("Membuka X (Twitter)...", "Informasi");
    setTimeout(() => window.open(twitterUrl, "_blank"), 300);
  }

  // ===== HANDLE SHARE (legacy) =====
  handleShare(item, url) {
    const fullUrl = window.location.origin + "/" + url;
    this.copyToClipboard(fullUrl, item.title);
  }

  copyToClipboard(url, title = "") {
    const notify = (msg, subMsg = "") => {
      if (typeof showToast === "function") {
        showToast(subMsg ? `"${subMsg}"` : "", "success", msg);
      } else {
        showAlert.success(msg, subMsg ? `"${subMsg}"` : "Sukses");
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

    if (this.searchQuery) {
      input.value = this.searchQuery;
      // Scroll to search or container if query from URL
      setTimeout(() => {
        const container = document.querySelector(this.containerSelector);
        if (container) container.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
    }

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

    container.innerHTML = `
      <div class="pill-pagination">
        <button class="prev-page" id="prevPage" ${this.currentPage === 1 ? "disabled" : ""}>
          <i data-feather="chevron-left"></i>
        </button>
        <div class="page-info">
          ${this.currentPage} of ${totalPages}
        </div>
        <button class="next-page" id="nextPage" ${this.currentPage === totalPages ? "disabled" : ""}>
          <i data-feather="chevron-right"></i>
        </button>
      </div>
    `;

    // Add event listeners
    const prevBtn = container.querySelector("#prevPage");
    const nextBtn = container.querySelector("#nextPage");

    if (prevBtn) prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
    if (nextBtn) nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
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

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-menu-container")) {
      document.querySelectorAll(".dropdown-content").forEach((el) => {
        el.style.display = "none";
      });
    }
  });
});

console.log("pagination_user.js loaded");
