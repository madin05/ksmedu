let currentPage = 1;
const limit = 20;
let currentSort = "newest";
let currentType = "";

async function loadAllComments(page = 1) {
  currentPage = page;
  const tbody = document.getElementById("commentsTableBody");
  const search = document.getElementById("searchInput").value.trim();

  tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding:48px;text-align:center;color:#94a3b8;">
          <div class="loading-spinner" style="margin:0 auto 12px;"></div>
          Memuat...
        </td>
      </tr>`;

  let url = `${window.APP_CONFIG.apiBase}/comments/list_all.php?page=${page}&limit=${limit}`;
  if (currentType) url += `&type=${encodeURIComponent(currentType)}`;
  if (currentSort) url += `&sort=${encodeURIComponent(currentSort)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();

    if (!data.ok) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:40px;text-align:center;color:#ef4444;">${
        data.message || "Akses ditolak"
      }</td></tr>`;
      return;
    }

    const total = data.total;
    document.getElementById("totalCount").textContent = `Total: ${total} komentar`;

    if (!data.comments || data.comments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:48px;text-align:center;color:#94a3b8;">Tidak ada komentar ditemukan.</td></tr>`;
      renderPagination(0, 0);
      return;
    }

    tbody.innerHTML = data.comments
      .map(
        (c) => `
        <tr data-row="${c.id}" style="border-bottom:1px solid #f1f5f9;transition:background .15s;">
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;background:${getAvatarColor(c.user_name)};color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">
                ${c.user_name.charAt(0).toUpperCase()}
              </div>
              <span style="font-weight:600;font-size:14px;color:#1e293b;">${
                c.user_name
              }</span>
            </div>
          </td>
          <td style="padding:14px 16px;">
            <span style="padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600;
              background:${c.article_type === "jurnal" ? "#dbeafe" : "#fed7aa"};
              color:${c.article_type === "jurnal" ? "#1e40af" : "#c2410c"};">
              ${c.article_type.toUpperCase()}
            </span>
          </td>
          <td style="padding:14px 16px;font-size:13px;color:#334155;max-width:400px;">
            <span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${c.content}
            </span>
          </td>
          <td style="padding:14px 16px;font-size:12px;color:#94a3b8;white-space:nowrap;">
            ${formatDate(c.created_at)}
          </td>
          <td style="padding:14px 16px;text-align:center;">
            <button
              onclick="adminDeleteComment(${c.id})"
              style="background:#fee2e2;color:#ef4444;border:none;padding:7px 12px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:4px;transition:all .2s;"
              onmouseover="this.style.background='#fecaca'"
              onmouseout="this.style.background='#fee2e2'"
            >
              <i data-feather="trash-2" style="width:13px;height:13px;"></i> Hapus
            </button>
          </td>
        </tr>
      `,
      )
      .join("");

    if (typeof feather !== "undefined") feather.replace();
    renderPagination(data.pages, page);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:40px;text-align:center;color:#ef4444;">Gagal memuat data.</td></tr>`;
  }
}

function renderPagination(totalPages, current) {
  const container = document.getElementById("pagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="pill-pagination">
      <button class="prev-page" id="prevPage" ${current === 1 ? "disabled" : ""}>
        <i data-feather="chevron-left"></i>
      </button>
      <div class="page-info">
        ${current} of ${totalPages}
      </div>
      <button class="next-page" id="nextPage" ${current === totalPages ? "disabled" : ""}>
        <i data-feather="chevron-right"></i>
      </button>
    </div>
  `;

  // Add event listeners
  const prevBtn = container.querySelector("#prevPage");
  const nextBtn = container.querySelector("#nextPage");

  if (prevBtn) prevBtn.onclick = () => loadAllComments(current - 1);
  if (nextBtn) nextBtn.onclick = () => loadAllComments(current + 1);

  if (typeof feather !== "undefined") feather.replace();
}

async function adminDeleteComment(commentId) {
  const confirmed = confirm("Yakin ingin menghapus komentar ini?");
  if (!confirmed) return;

  try {
    const res = await fetch(`${window.APP_CONFIG.apiBase}/comments/delete.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId }),
    });
    const data = await res.json();

    if (data.ok) {
      const row = document.querySelector(`[data-row="${commentId}"]`);
      if (row) {
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 300);
      }
      const tc = document.getElementById("totalCount");
      const m = tc.textContent.match(/\d+/);
      if (m)
        tc.textContent = `Total: ${Math.max(0, parseInt(m[0]) - 1)} komentar`;
    } else {
      alert(data.message || "Gagal menghapus.");
    }
  } catch (e) {
    alert("Terjadi kesalahan jaringan.");
  }
}

function formatDate(str) {
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setupFilterDropdown() {
    const trigger = document.getElementById("btnFilterTrigger");
    const dropdown = trigger?.closest(".sort-dropdown");
    const typeItems = document.querySelectorAll(".filter-type-item");
    const sortItems = document.querySelectorAll(".filter-sort-item");

    if (!trigger) return;

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
    });

    document.addEventListener("click", () => {
        dropdown.classList.remove("active");
    });

    typeItems.forEach(item => {
        item.addEventListener("click", () => {
            currentType = item.getAttribute("data-type");
            typeItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            loadAllComments(1);
        });
    });

    sortItems.forEach(item => {
        item.addEventListener("click", () => {
            currentSort = item.getAttribute("data-sort");
            sortItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            loadAllComments(1);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    this.loadingSpinner = document.getElementById("commentsLoading");
    if (this.loadingSpinner) {
        this.loadingSpinner.className = "loader";
    }
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") loadAllComments();
        });
    }

    setupFilterDropdown();
    loadAllComments();
    if (typeof feather !== "undefined") feather.replace();
});

window.addEventListener("userIdentityChanged", () => {
  loadAllComments();
});
