<?php
$page_title = 'Kelola Komentar - KSM Admin';
$extra_head = '<link rel="stylesheet" href="../styles/explore_admin.css" />';
include 'components/header.php';
include 'components/sidebar.php';
?>

<div class="admin-comments-page" style="max-width:1100px;margin:32px auto;padding:0 24px;">

  <!-- Page Header -->
  <div class="page-header" style="margin-bottom:24px;">
    <h1 style="font-size:1.8rem;font-weight:700;color:#1e293b;display:flex;align-items:center;gap:10px;">
      <i data-feather="message-circle" style="color:#3b82f6;width:28px;height:28px;"></i>
      Kelola Komentar
    </h1>
    <p style="color:#64748b;margin-top:4px;">Lihat dan hapus semua komentar dari seluruh artikel.</p>
  </div>

  <!-- Filters -->
  <style>
    .comments-filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 24px;
      align-items: center;
    }
    .filter-group {
      display: flex;
      gap: 8px;
      flex: 1;
      min-width: 280px;
    }
    .filter-select {
      padding: 9px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #334155;
      background: white;
      cursor: pointer;
      min-width: 140px;
    }
    .search-input {
      flex: 1;
      padding: 9px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      color: #334155;
      background: white;
      outline: none;
    }
    .btn-search {
      padding: 9px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #totalCount {
      font-size: 13px;
      color: #64748b;
      margin-left: auto;
    }
    @media (max-width: 600px) {
      .comments-filters {
        flex-direction: column;
        align-items: stretch;
      }
      .filter-group {
        min-width: 100%;
      }
      .filter-select {
        width: 100%;
      }
      #totalCount {
        margin-left: 0;
        text-align: right;
        border-top: 1px solid #f1f5f9;
        padding-top: 8px;
      }
    }
  </style>

  <div class="comments-filters">
    <select id="filterType" class="filter-select">
      <option value="">Semua Tipe</option>
      <option value="jurnal">Jurnal</option>
      <option value="opini">Opini</option>
    </select>
    <div class="filter-group">
      <input
        id="searchInput"
        class="search-input"
        type="text"
        placeholder="Cari username atau isi komentar..."
      />
      <button onclick="loadAllComments()" class="btn-search">
        <i data-feather="search" style="width:14px;height:14px;"></i> Cari
      </button>
    </div>
    <span id="totalCount"></span>
  </div>

  <!-- Comments Table -->
  <div style="background:white;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;border:1px solid #e2e8f0;">
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:800px;" id="commentsTable">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Pengguna</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Tipe</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Komentar</th>
            <th style="padding:14px 16px;text-align:left;font-size:13px;font-weight:600;color:#64748b;">Tanggal</th>
            <th style="padding:14px 16px;text-align:center;font-size:13px;font-weight:600;color:#64748b;">Aksi</th>
          </tr>
        </thead>
        <tbody id="commentsTableBody">
          <tr>
            <td colspan="5" style="padding:48px;text-align:center;color:#94a3b8;">
              <div class="loading-spinner" style="margin:0 auto 12px;"></div>
              Memuat komentar...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Pagination -->
  <div id="pagination" style="display:flex;justify-content:center;gap:8px;margin:24px 0;flex-wrap:wrap;"></div>

</div>

<?php
$extra_scripts = <<<'EOT'
<script src="../js/custom_alerts.js"></script>
<script>
  let currentPage = 1;
  const limit = 20;

  async function loadAllComments(page = 1) {
    currentPage = page;
    const tbody   = document.getElementById('commentsTableBody');
    const type    = document.getElementById('filterType').value;
    const search  = document.getElementById('searchInput').value.trim();

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding:48px;text-align:center;color:#94a3b8;">
          <div class="loading-spinner" style="margin:0 auto 12px;"></div>
          Memuat...
        </td>
      </tr>`;

    let url = `/ksmaja/api/comments/list_all.php?page=${page}&limit=${limit}`;
    if (type)   url += `&type=${encodeURIComponent(type)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    try {
      const res  = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (!data.ok) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:40px;text-align:center;color:#ef4444;">${data.message || 'Akses ditolak'}</td></tr>`;
        return;
      }

      const total = data.total;
      document.getElementById('totalCount').textContent = `Total: ${total} komentar`;

      if (!data.comments || data.comments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:48px;text-align:center;color:#94a3b8;">Tidak ada komentar ditemukan.</td></tr>`;
        renderPagination(0, 0);
        return;
      }

      tbody.innerHTML = data.comments.map(c => `
        <tr data-row="${c.id}" style="border-bottom:1px solid #f1f5f9;transition:background .15s;">
          <td style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">
                ${c.user_name.charAt(0).toUpperCase()}
              </div>
              <span style="font-weight:600;font-size:14px;color:#1e293b;">${c.user_name}</span>
            </div>
          </td>
          <td style="padding:14px 16px;">
            <span style="padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600;
              background:${c.article_type === 'jurnal' ? '#dbeafe' : '#fed7aa'};
              color:${c.article_type === 'jurnal' ? '#1e40af' : '#c2410c'};">
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
      `).join('');

      if (typeof feather !== 'undefined') feather.replace();
      renderPagination(data.pages, page);

    } catch(e) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding:40px;text-align:center;color:#ef4444;">Gagal memuat data.</td></tr>`;
    }
  }

  function renderPagination(totalPages, current) {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const btnStyle = (active) =>
      `padding:7px 13px;border-radius:7px;border:none;font-size:13px;font-weight:600;cursor:pointer;
       background:${active ? '#3b82f6' : '#f1f5f9'};color:${active ? 'white' : '#334155'};`;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.style.cssText = btnStyle(i === current);
      btn.onclick = () => loadAllComments(i);
      container.appendChild(btn);
    }
  }

  async function adminDeleteComment(commentId) {
    const confirmed = confirm('Yakin ingin menghapus komentar ini?');
    if (!confirmed) return;

    try {
      const res  = await fetch('/ksmaja/api/comments/delete.php', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ comment_id: commentId }),
      });
      const data = await res.json();

      if (data.ok) {
        const row = document.querySelector(`[data-row="${commentId}"]`);
        if (row) { row.style.opacity = '0'; setTimeout(() => row.remove(), 300); }
        const tc = document.getElementById('totalCount');
        const m  = tc.textContent.match(/\d+/);
        if (m) tc.textContent = `Total: ${Math.max(0, parseInt(m[0]) - 1)} komentar`;
      } else {
        alert(data.message || 'Gagal menghapus.');
      }
    } catch(e) {
      alert('Terjadi kesalahan jaringan.');
    }
  }

  function formatDate(str) {
    return new Date(str).toLocaleDateString('id-ID', {
      day:'numeric', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  }

  // Enter key on search triggers search
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadAllComments();
  });
  document.getElementById('filterType').addEventListener('change', () => loadAllComments());

  // Listen for login/logout events to refresh data
  window.addEventListener('userIdentityChanged', () => {
    console.log("Identity changed, reloading comments...");
    loadAllComments();
  });

  // Initial load
  loadAllComments();

  if (typeof feather !== 'undefined') feather.replace();
</script>
EOT;
include 'components/footer.php';
?>
