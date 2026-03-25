// ===== DASHBOARD USER - COMPLETE FIXED VERSION =====
// Fixed: Share button positioning konsisten

feather.replace();

// ===== TRACK VIEWED ARTICLES (PREVENT DUPLICATE VIEWS) =====
const viewedArticles = new Set(
  JSON.parse(localStorage.getItem("viewedArticles") || "[]"),
);

function markAsViewed(articleId) {
  viewedArticles.add(String(articleId));
  localStorage.setItem("viewedArticles", JSON.stringify([...viewedArticles]));
}

function hasBeenViewed(articleId) {
  return viewedArticles.has(String(articleId));
}

// ===== LOGIN STATUS CHECK =====
function checkLoginStatus() {
  return sessionStorage.getItem("userLoggedIn") === "true";
}

function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

// ===== LOAD ARTICLES FROM DATABASE =====
async function loadArticles() {
  try {
    console.log("Loading articles from database...");

    const timestamp = Date.now();

    const journalsResponse = await fetchWithTimeout(
      `${window.APP_CONFIG.apiBase}/list_journals.php?limit=50&offset=0&t=${timestamp}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } },
    );
    const journalsData = await journalsResponse.json();

    let opinionsData = { ok: false, results: [] };
    try {
      const opinionsResponse = await fetch(
        `${window.APP_CONFIG.apiBase}/list_opinions.php?limit=50&offset=0&t=${timestamp}`,
        {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        },
      );
      opinionsData = await opinionsResponse.json();
    } catch (e) {
      console.warn("No opinions endpoint, skipping...");
    }

    let journals = [];
    let opinions = [];

    if (journalsData.ok && journalsData.results) {
      journals = journalsData.results.map((j) => {
        const authors = j.authors
          ? typeof j.authors === "string"
            ? JSON.parse(j.authors)
            : j.authors
          : [];
        const tags = j.tags
          ? typeof j.tags === "string"
            ? JSON.parse(j.tags)
            : j.tags
          : [];
        return {
          id: j.id,
          title: j.title,
          judul: j.title,
          abstract: j.abstract,
          abstrak: j.abstract,
          authors: authors,
          author: authors,
          penulis: authors.length > 0 ? authors[0] : "Admin",
          tags: tags,
          date: j.created_at,
          uploadDate: j.created_at,
          fileData: j.file_url,
          coverImage:
            j.cover_url ||
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
          cover: j.cover_url,
          views: j.views || 0,
          type: "jurnal",
        };
      });
    }

    if (opinionsData.ok && opinionsData.results) {
      opinions = opinionsData.results.map((o) => {
        const tags = o.tags
          ? typeof o.tags === "string"
            ? JSON.parse(o.tags)
            : o.tags
          : [];
        return {
          id: o.id,
          title: o.title,
          judul: o.title,
          description: o.description,
          abstract: o.description,
          abstrak: o.description,
          category: o.category || "opini",
          author: [o.author_name || "Anonymous"],
          authors: [o.author_name || "Anonymous"],
          penulis: o.author_name || "Anonymous",
          tags: tags,
          date: o.created_at,
          uploadDate: o.created_at,
          coverImage:
            o.cover_url ||
            "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop",
          cover: o.cover_url,
          fileUrl: o.file_url,
          fileData: o.file_url,
          views: o.views || 0,
          type: "opini",
        };
      });
    }

    const articles = [...journals, ...opinions].sort((a, b) => {
      const dateA = new Date(a.uploadDate || a.date || 0);
      const dateB = new Date(b.uploadDate || b.date || 0);
      return dateB - dateA;
    });

    console.log(`Total articles from database: ${articles.length}`);
    return articles;
  } catch (error) {
    console.error("Error loading articles from database:", error);
    return [];
  }
}

let articles = [];

// ===== NAVIGATE TO ARTICLE DETAIL (WITH VIEW TRACKING) =====
function openArticleDetail(articleId, articleType) {
  console.log("Opening article:", articleId, articleType);

  if (!hasBeenViewed(articleId)) {
    updateArticleViews(articleId, articleType);
    markAsViewed(articleId);
  } else {
    console.log("Article already viewed, skipping view count update");
  }

  const targetPage =
    articleType === "opini"
      ? "explore_opini_user.php"
      : "explore_jurnal_user.php";

  window.location.href = `${targetPage}?id=${articleId}&type=${articleType}`;
}

// ===== UPDATE VIEWS (ONLY ONCE PER USER) =====
async function updateArticleViews(id, type) {
  try {
    await fetch(`${window.APP_CONFIG.apiBase}/update_views.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id,
        type: type === "opini" ? "opinion" : "journal",
      }),
    });
    console.log("View updated for:", id);
  } catch (error) {
    console.warn("Failed to update views:", error);
  }
}

function escapeForAttribute(text) {
  return (text || "")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function renderArticles() {
  const grid = document.getElementById("articlesGrid");
  const navUser = document.getElementById("latestArticlesNavUser");

  showSkeletonUI();

  if (navUser) navUser.innerHTML = "";

  articles = await loadArticles();

  if (articles.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"></div>
        <h3>BELUM ADA ARTIKEL</h3>
        <p>ARTIKEL AKAN MUNCUL DI SINI SETELAH ADMIN MENGUPLOAD JURNAL</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = articles
    .slice(0, 6)
    .map((article) => {
      const title = article.title || article.judul || "UNTITLED";
      const author = Array.isArray(article.authors)
        ? article.authors[0]
        : Array.isArray(article.author)
          ? article.author[0]
          : article.author || article.penulis || "ADMIN";

      const date =
        article.date || article.uploadDate || new Date().toISOString();
      const formattedDate = new Date(date).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const coverImage =
        article.coverImage ||
        article.cover ||
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop";

      const views = article.views || 0;
      const abstract = article.abstract || article.abstrak || "";
      const truncatedAbstract =
        abstract.length > 100 ? abstract.substring(0, 100) + "..." : abstract;

      const typeLabel = article.type === "opini" ? "OPINI" : "JURNAL";
      const typeClass =
        article.type === "opini" ? "badge-opini" : "badge-jurnal";

      return `
        <div class="article-card" onclick="if(!event.target.closest('.dropdown-menu-container')) openArticleDetail('${article.id}', '${article.type}')" style="cursor: pointer;">
          <div class="article-image-container">
            <img src="${coverImage}" alt="${title}" class="article-image"
                 onerror="this.src='https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop'">
            <div class="article-views-badge">
              <i data-feather="eye" style="width: 14px; height: 14px;"></i> ${views}
            </div>
            <span class="article-type-badge ${typeClass}">${typeLabel}</span>
          </div>
          
          <div class="article-content">
            <h3 class="article-title">
              ${title}
            </h3>
            
            <p class="article-excerpt">${truncatedAbstract || "Tidak ada deskripsi"}</p>
            
            <div class="article-meta">
              <span><i data-feather="user" style="width: 14px; height: 14px;"></i> ${author}</span>
              <span><i data-feather="calendar" style="width: 14px; height: 14px;"></i> ${formattedDate}</span>
            </div>

            ${(() => {
              const tags = Array.isArray(article.tags) ? article.tags : [];
              if (tags.length === 0) return "";
              return `
                <div class="article-tags">
                  ${tags
                    .slice(0, 3)
                    .map((tag) => `<span class="article-tag">${tag}</span>`)
                    .join("")}
                  ${tags.length > 3 ? `<span class="article-tag-more">+${tags.length - 3}</span>` : ""}
                </div>
              `;
            })()}

            <div class="card-actions">
              <div class="dropdown-menu-container">
                <button class="dropdown-toggle" onclick="event.stopPropagation(); window.dashboardDropdownToggle('dashboard-dd-${article.id}')">
                  <i data-feather="more-vertical"></i>
                </button>
                <div id="dashboard-dd-${article.id}" class="dropdown-content">
                  <button class="dropdown-item-btn dd-download" onclick="event.stopPropagation(); window.downloadDashboardArticle('${article.fileData || ''}', '${escapeForAttribute(title)}', '${article.type}', '${article.id}')">
                    <i data-feather="download"></i> Download
                  </button>
                  <button class="dropdown-item-btn dd-share" onclick="event.stopPropagation(); if(window.shareManager) window.shareManager.handleShare('${article.id}', '${article.type}', '${escapeForAttribute(title)}')">
                    <i data-feather="share-2"></i> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  if (navUser) {
    if (articles.length > 6) {
      navUser.innerHTML = `
        <button class="btn-see-all" onclick="window.location.href='journals_user.php'">
          LIHAT SEMUA ARTIKEL
        </button>
      `;
    } else {
      navUser.innerHTML = "";
    }
  }

  feather.replace();
  console.log("Articles rendered, Share buttons ready");
}

function showSkeletonUI() {
  const grid = document.getElementById("articlesGrid");
  if (!grid) return;

  grid.innerHTML = "";
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
    grid.appendChild(skeleton);
  }
}

// ===== LOGOUT HANDLER =====
function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const confirmed = await showAlert.confirm(
        "YAKIN INGIN LOGOUT?",
        "Konfirmasi Logout",
      );
      if (confirmed) {
        sessionStorage.clear();
        localStorage.removeItem("userEmail");
        window.location.href = "./login_user.php";
      }
    });
  }
}

// ===== NEWSLETTER SUBSCRIPTION =====
function setupNewsletter() {
  const subscribeBtn = document.getElementById("subscribeBtn");
  const newsletterEmail = document.getElementById("newsletterEmail");

  if (subscribeBtn && newsletterEmail) {
    subscribeBtn.addEventListener("click", () => {
      const email = newsletterEmail.value.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast(
          "Terima kasih! Anda telah berhasil subscribe newsletter.",
          "success",
        );
        newsletterEmail.value = "";
      } else {
        showToast("Mohon masukkan email yang valid.", "error");
      }
    });

    newsletterEmail.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        subscribeBtn.click();
      }
    });
  }
}

// ===== SET USER NAME =====
function setUserName() {
  const userEmail = sessionStorage.getItem("userEmail");
  if (userEmail) {
    const userName = userEmail.split("@")[0].toUpperCase();
    const userNameEl = document.querySelector(".user-name");
    const userAvatarEl = document.querySelector(".user-avatar");
    if (userNameEl) userNameEl.textContent = userName;
    if (userAvatarEl) userAvatarEl.textContent = userName.charAt(0);
  }
}

// ===== GUEST MODE SETUP =====
function setupGuestMode() {
  const isLoggedIn = checkLoginStatus();

  const loggedInElements = [
    document.getElementById("userProfile"),
    document.getElementById("logoutBtn"),
    document.querySelector(".user-info-section"),
  ];

  if (!isLoggedIn) {
    loggedInElements.forEach((el) => {
      if (el) el.style.display = "none";
    });

    const navbar = document.querySelector(".navbar");
    if (navbar && !document.getElementById("guestLoginBtn")) {
      const loginBtn = document.createElement("a");
      loginBtn.id = "guestLoginBtn";
      loginBtn.href = "./login_user.php";
      loginBtn.className = "btn-guest-login";
      loginBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        LOGIN
      `;
      navbar.appendChild(loginBtn);
    }

    const userNameEl = document.querySelector(".user-name");
    const userAvatarEl = document.querySelector(".user-avatar");
    if (userNameEl) userNameEl.textContent = "GUEST";
    if (userAvatarEl) userAvatarEl.textContent = "G";
  } else {
    loggedInElements.forEach((el) => {
      if (el) el.style.display = "block";
    });

    const guestBtn = document.getElementById("guestLoginBtn");
    if (guestBtn) guestBtn.remove();

    setUserName();
  }
}

// ===== SEARCH FUNCTIONALITY =====
function setupSearch() {
  const searchInput = document.querySelector(".search-box input");

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `journals_user.php?search=${encodeURIComponent(
            query,
          )}`;
        }
      }
    });
  }
}

// Local showToast removed in favor of global showToast from script.js

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing User Dashboard (Database Mode)...");

  setupGuestMode();
  setupLogout();
  setupNewsletter();
  setupSearch();

  await renderArticles();

  feather.replace();
  console.log("User Dashboard ready");
});

// ===== SHARE MANAGER =====
class ShareManager {
  constructor() {
    this.init();
  }

  init() {
    console.log("Initializing Share Manager...");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.setupEventListeners(),
      );
    } else {
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    document.body.addEventListener(
      "click",
      (e) => {
        const shareBtn = e.target.closest(".btn-share-article");
        if (shareBtn) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          const articleId = shareBtn.getAttribute("data-article-id");
          const articleType = shareBtn.getAttribute("data-article-type");
          const articleTitle = shareBtn.getAttribute("data-article-title");

          console.log("Share button clicked:", {
            articleId,
            articleType,
            articleTitle,
          });

          this.handleShare(articleId, articleType, articleTitle);
          return false;
        }
      },
      true,
    );

    console.log("Share event listeners attached");
  }

  handleShare(articleId, articleType, articleTitle) {
    const baseUrl = window.location.origin;
    const path = window.location.pathname.substring(
      0,
      window.location.pathname.lastIndexOf("/"),
    );

    const targetPage =
      articleType === "opini"
        ? "explore_opini_user.php"
        : "explore_jurnal_user.php";

    const shareUrl = `${baseUrl}${path}/${targetPage}?id=${articleId}&type=${articleType}`;

    console.log("Sharing URL:", shareUrl);

    this.copyToClipboard(shareUrl, articleTitle);
  }

  async copyToClipboard(url, title) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        this.showShareSuccess(title);
      } else {
        this.fallbackCopyToClipboard(url);
        this.showShareSuccess(title);
      }
    } catch (err) {
      console.error("Copy failed:", err);
      try {
        this.fallbackCopyToClipboard(url);
        this.showShareSuccess(title);
      } catch (fallbackErr) {
        showToast("Gagal menyalin link. Silakan coba lagi.", "error");
      }
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      textArea.remove();
    } catch (err) {
      textArea.remove();
      throw err;
    }
  }

  showShareSuccess(title) {
    if (typeof showToast === "function") {
      showToast('"' + title + '"', "success", "Link berhasil disalin!");
    } else {
      const truncatedTitle =
        title.length > 40 ? title.substring(0, 40) + "..." : title;
      const message = `Link berhasil disalin!\n"${truncatedTitle}"`;
      showAlert.success(message, "Sukses");
    }
  }
}

// ===== DYNAMIC CATEGORIES MANAGER =====
class DynamicCategoriesManager {
  constructor() {
    this.categories = new Map();
    this.loadCategories();
  }

  async loadCategories() {
    try {
      console.log("Loading dynamic categories from database...");

      const timestamp = Date.now();

      const [journalsResponse, opinionsResponse] = await Promise.all([
        fetch(
          `${window.APP_CONFIG.apiBase}/list_journals.php?limit=100&offset=0&t=${timestamp}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          },
        ),
        fetch(
          `${window.APP_CONFIG.apiBase}/list_opinions.php?limit=1000&offset=0&t=${timestamp}`,
          {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          },
        ).catch(() => ({ json: async () => ({ ok: false, results: [] }) })),
      ]);

      const journalsData = await journalsResponse.json();
      const opinionsData = await opinionsResponse.json();

      const allArticles = [
        ...(journalsData.ok ? journalsData.results : []),
        ...(opinionsData.ok ? opinionsData.results : []),
      ];

      this.processArticleTags(allArticles);
      this.renderCategories();

      console.log(`Loaded ${this.categories.size} dynamic categories`);
    } catch (error) {
      console.error("Error loading categories:", error);
      this.renderFallbackCategories();
    }
  }

  processArticleTags(articles) {
    this.categories.clear();

    articles.forEach((article) => {
      let tags = article.tags;

      if (typeof tags === "string" && tags.trim()) {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [tags];
        }
      }

      if (!Array.isArray(tags)) {
        tags = [];
      }

      tags.forEach((tag) => {
        const normalizedTag = this.normalizeTag(tag);
        if (normalizedTag) {
          const currentCount = this.categories.get(normalizedTag) || 0;
          this.categories.set(normalizedTag, currentCount + 1);
        }
      });
    });

    this.categories = new Map(
      [...this.categories.entries()].sort((a, b) => b[1] - a[1]),
    );
  }

  normalizeTag(tag) {
    if (!tag || typeof tag !== "string") return null;

    return tag
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  renderCategories() {
    const grid = document.querySelector(".categories-grid");
    if (!grid) {
      console.warn("Categories grid element not found");
      return;
    }

    const topCategories = [...this.categories.entries()].slice(0, 12);

    if (topCategories.length === 0) {
      grid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px 0;">Belum ada kategori. Tambahkan tags saat upload artikel.</div>';
      return;
    }

    grid.innerHTML = topCategories
      .map(
        ([category, count]) => `
      <div class="category-card" onclick="window.location.href='journals_user.php?category=${encodeURIComponent(
        category,
      )}'" style="cursor: pointer;">
        <span class="category-name">${this.escapeHtml(category)}</span>
        <span class="category-count">(${count})</span>
      </div>
    `,
      )
      .join("");

    console.log(`Rendered ${topCategories.length} categories to UI`);
  }

  renderFallbackCategories() {
    const grid = document.querySelector(".categories-grid");
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px 0;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></div>
        <p>Belum ada kategori.</p>
        <small style="opacity: 0.7;">Kategori akan muncul otomatis dari tags artikel.</small>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// ===== INITIALIZE =====
console.log("Initializing Share & Dynamic Categories...");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.shareManager = new ShareManager();
    window.dynamicCategoriesManager = new DynamicCategoriesManager();
  });
} else {
  window.shareManager = new ShareManager();
  window.dynamicCategoriesManager = new DynamicCategoriesManager();
}

// ===== DASHBOARD DROPDOWN & ACTIONS =====
window.dashboardDropdownToggle = function (dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  // Close all other dropdowns
  document.querySelectorAll(".dropdown-content").forEach((el) => {
    if (el.id !== dropdownId) el.style.display = "none";
  });

  // Toggle current
  dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
};

// ===== DOWNLOAD ARTICLE =====
window.downloadDashboardArticle = async function (fileUrlOrId, itemTitle, dataType, itemId) {
  try {
    let fileUrl = fileUrlOrId;

    // Jika argumen pertama bukan URL (hanya ID), tarik dari API (fallback)
    if (!fileUrl || (!fileUrl.includes("/") && !fileUrl.includes("http"))) {
      const id = fileUrlOrId || itemId;
      const endpoint =
        dataType === "opini"
          ? `${window.APP_CONFIG.apiBase}/get_opinion.php?id=${id}`
          : `${window.APP_CONFIG.apiBase}/get_journal.php?id=${id}`;

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
      console.error("File URL not found");
      showAlert.error("File tidak ditemukan!", "Download Gagal");
      return;
    }

    console.log("Triggering download for:", fileUrl);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = itemTitle + ".pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();

    // Small delay before removing to ensure download starts
    setTimeout(() => document.body.removeChild(link), 100);

    // Show better notification
    if (typeof showToast === "function") {
      showToast(`${itemTitle}.pdf berhasil diunduh!`, "success", "Download Sukses");
    } else {
      showAlert.success(`${itemTitle}.pdf berhasil diunduh!`, "Download Sukses");
    }
  } catch (error) {
    console.error("Download error:", error);
    showAlert.error("Gagal download file: " + error.message, "Download Gagal");
  }

  // Close dropdown
  document.querySelectorAll(".dropdown-content").forEach((el) => {
    el.style.display = "none";
  });
};

// ===== OPEN SHARE MODAL =====
window.openDashboardShareModal = function (itemId, itemTitle, dataType) {
  const pageUrl =
    dataType === "opini"
      ? `explore_opini_user.php?id=${itemId}&type=opini`
      : `explore_jurnal_user.php?id=${itemId}&type=jurnal`;

  const baseUrl = window.location.origin + window.APP_CONFIG.ROOT + "/";
  const fullShareUrl = baseUrl + pageUrl;

  let modal = document.getElementById("dashboardShareModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "dashboardShareModal";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-overlay" onclick="document.getElementById('dashboardShareModal').style.display='none'"></div>
        <div class="modal-content" style="max-width: 400px">
          <button type="button" class="close-modal" onclick="document.getElementById('dashboardShareModal').style.display='none'">
            <i data-feather="x"></i>
          </button>
          <h2 style="margin-bottom: 20px">Bagikan ${itemTitle}</h2>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <input
              type="text"
              id="dashboardShareUrlInput"
              value="${fullShareUrl}"
              readonly
              style="
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
              "
            />
            <button onclick="window.copyDashboardLink()" class="share-btn copy" style="width:100%; padding:10px; border:none; cursor:pointer; border-radius:6px; background:#3498db; color:white; display:flex; align-items:center; justify-content:center; gap:8px;">
              <i data-feather="copy" style="width:16px;height:16px;"></i> Copy Link
            </button>
            <button onclick="window.shareToDashboardWhatsApp('${fullShareUrl}', '${itemTitle}')" class="share-btn wa" style="width:100%; padding:10px; border:none; cursor:pointer; border-radius:6px; background:#25d366; color:white; display:flex; align-items:center; justify-content:center; gap:8px;">
              <i data-feather="message-circle" style="width:16px;height:16px;"></i> Share ke WhatsApp
            </button>
            <button onclick="window.shareToDashboardFacebook('${fullShareUrl}')" class="share-btn fb" style="width:100%; padding:10px; border:none; cursor:pointer; border-radius:6px; background:#1877f2; color:white; display:flex; align-items:center; justify-content:center; gap:8px;">
              <i data-feather="facebook" style="width:16px;height:16px;"></i> Share ke Facebook
            </button>
            <button onclick="window.shareToDashboardTwitter('${fullShareUrl}', '${itemTitle}')" class="share-btn x" style="width:100%; padding:10px; border:none; cursor:pointer; border-radius:6px; background:#000000; color:white; display:flex; align-items:center; justify-content:center; gap:8px;">
              <i data-feather="x" style="width:16px;height:16px;"></i> Share ke X
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.querySelector("#dashboardShareUrlInput").value = fullShareUrl;
  }

  modal.style.display = "block";
  if (typeof feather !== "undefined") feather.replace();

  // Close dropdown
  document.querySelectorAll(".dropdown-content").forEach((el) => {
    el.style.display = "none";
  });
};

// ===== COPY LINK =====
window.copyDashboardLink = function () {
  const input = document.getElementById("dashboardShareUrlInput");
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
};

// ===== SHARE TO WHATSAPP =====
window.shareToDashboardWhatsApp = function (url, title) {
  const text = `Cek artikel "${title}" di sini: ${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  showAlert.success("Membuka WhatsApp...", "Informasi");
  setTimeout(() => window.open(whatsappUrl, "_blank"), 300);
};

// ===== SHARE TO FACEBOOK =====
window.shareToDashboardFacebook = function (url) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=Cek%20artikel%20ini`;
  showAlert.success("Membuka Facebook...", "Informasi");
  setTimeout(
    () => window.open(facebookUrl, "_blank", "width=600,height=400"),
    300,
  );
};

// ===== SHARE TO TWITTER/X =====
window.shareToDashboardTwitter = function (url, title) {
  const text = `Cek artikel "${title}" di KSM Education`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  showAlert.success("Membuka X (Twitter)...", "Informasi");
  setTimeout(() => window.open(twitterUrl, "_blank"), 300);
};

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown-menu-container")) {
    document.querySelectorAll(".dropdown-content").forEach((el) => {
      el.style.display = "none";
    });
  }
});

// Internal styles removed in favor of global CSS
const styles = document.createElement("style");
styles.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styles);

console.log("Dashboard User initialized - Download & Share actions added");
