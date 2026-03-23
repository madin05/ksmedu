/**
 * comments.js — Shared comment module
 * Used by: user and admin explore pages (jurnal & opini)
 *
 * Handles: load, render, submit, delete comments, and threaded replies
 * Auth detection: calls /ksmaja/api/auth_me.php to check session
 */

(function () {
  'use strict';

  // ========== STATE ==========
  let currentUser = null; // { id, name, role } or null
  let currentArticleId = null;
  let currentArticleType = null;

  // ========== INIT ==========
  let isInitializing = false;
  async function initComments(articleId, articleType) {
    if (isInitializing) return;
    isInitializing = true;
    
    currentArticleId = articleId;
    currentArticleType = articleType;

    // Check current user session
    try {
      const isAdminPage = window.location.pathname.includes('/admin/');
      const res = await fetch('/ksmaja/api/auth_me.php', { credentials: 'include' });
      const data = await res.json();
      
      if (data.ok && data.user) {
        // If on admin page, we ONLY accept admin role. 
        if (isAdminPage && data.user.role !== 'admin') {
          console.warn("User session detected on admin page. Waiting for admin sync...");
          currentUser = null;
        } else {
          currentUser = data.user;
        }
      } else {
        currentUser = null;
      }
    } catch (e) {
      currentUser = null;
    }

    renderCommentSection(articleId, articleType);
    await loadComments(articleId, articleType);
    isInitializing = false;
  }

  // EXPOSE TO GLOBALS
  window.initComments = initComments;

  // Listen for identity changes (login/logout)
  window.addEventListener('userIdentityChanged', () => {
    if (currentArticleId && currentArticleType && !isInitializing) {
        initComments(currentArticleId, currentArticleType);
    }
  });

  // ========== RENDER SECTION SHELL ==========
  function renderCommentSection(articleId, articleType) {
    const section = document.getElementById('comments-section');
    if (!section) return;

    const isLoggedIn = !!currentUser;

    const formHTML = isLoggedIn
      ? `<div class="comment-form-wrap top-level-form">
           <div class="comment-avatar">${avatarLetter(currentUser.name)}</div>
           <div class="comment-input-area">
             <textarea
               id="commentInput"
               class="comment-textarea"
               placeholder="Tulis komentar kamu..."
               maxlength="2000"
               rows="3"
             ></textarea>
             <div class="comment-form-footer">
               <span class="comment-char-count"><span id="charCount">0</span>/2000</span>
               <button id="submitComment" class="btn-comment-submit">
                 <i data-feather="send"></i> Kirim
               </button>
             </div>
           </div>
         </div>`
      : `<div class="comment-login-prompt">
           <i data-feather="lock"></i>
           <p>Silakan <a href="/ksmaja/user/login_user.php">login</a> untuk berkomentar.</p>
         </div>`;

    section.innerHTML = `
      <div class="comments-section-inner">
        <h2 class="comments-title">
          <i data-feather="message-circle"></i>
          Diskusi &amp; Komentar
          <span class="comments-count-badge" id="commentsCount">0</span>
        </h2>

        ${formHTML}

        <div id="commentsList" class="comments-list">
          <div class="comments-loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </div>
    `;

    // Attach listeners
    if (isLoggedIn) {
      document.getElementById('submitComment').addEventListener('click', () => {
        submitComment(articleId, articleType);
      });
      const textarea = document.getElementById('commentInput');
      textarea.addEventListener('input', () => {
        document.getElementById('charCount').textContent = textarea.value.length;
      });
    }

    if (typeof feather !== 'undefined') feather.replace();
  }

  // ========== LOAD COMMENTS ==========
  async function loadComments(articleId, articleType) {
    const list = document.getElementById('commentsList');
    if (!list) return;

    try {
      const res = await fetch(
        `/ksmaja/api/comments/get.php?article_id=${articleId}&type=${articleType}`,
        { credentials: 'include' }
      );
      const data = await res.json();

      if (!data.ok) {
        list.innerHTML = '<p class="comments-empty">Gagal memuat komentar.</p>';
        return;
      }

      const tree = buildCommentTree(data.comments);
      renderComments(tree, articleId, articleType);

      const badge = document.getElementById('commentsCount');
      if (badge) badge.textContent = data.total;

    } catch (e) {
      list.innerHTML = '<p class="comments-empty">Gagal memuat komentar.</p>';
    }
  }

  // ========== TREE BUILDER ==========
  function buildCommentTree(flatComments) {
    const map = {};
    const roots = [];

    flatComments.forEach(c => {
      map[c.id] = { ...c, children: [] };
    });

    flatComments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  }

  // ========== RENDER COMMENT LIST ==========
  function renderComments(commentTree, articleId, articleType) {
    const list = document.getElementById('commentsList');
    if (!list) return;

    if (!commentTree || commentTree.length === 0) {
      list.innerHTML = `
        <div class="comments-empty">
          <i data-feather="message-square"></i>
          <p>Belum ada komentar. Jadilah yang pertama!</p>
        </div>
      `;
      if (typeof feather !== 'undefined') feather.replace();
      return;
    }

    list.innerHTML = commentTree.map(c => renderCommentNode(c, 0)).join('');
    if (typeof feather !== 'undefined') feather.replace();
  }

  // ========== RENDER SINGLE NODE (RECURSIVE) ==========
  function renderCommentNode(comment, depth) {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isOwner = currentUser && (parseInt(currentUser.id) === parseInt(comment.user_id));
    const canDelete = isOwner || isAdmin;
    const canReply = !!currentUser;
    const isChild = depth > 0;

    const childrenHTML = comment.children.length > 0
      ? `<div class="comment-replies">
           ${comment.children.map(child => renderCommentNode(child, depth + 1)).join('')}
         </div>`
      : '';

    return `
      <div class="comment-node ${isChild ? 'is-reply' : ''}" data-comment-id="${comment.id}">
        <div class="comment-card">
          <div class="comment-header">
            <div class="comment-avatar-sm">${avatarLetter(comment.user_name)}</div>
            <div class="comment-meta">
              <span class="comment-author">${comment.user_name}</span>
              <span class="comment-date">${formatDate(comment.created_at)}</span>
              ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            </div>
            <div class="comment-actions">
              ${canReply ? `<button class="btn-reply-toggle" onclick="window.CommentsModule.toggleReplyForm(${comment.id})"><i data-feather="corner-up-left"></i> Balas</button>` : ''}
              ${canDelete ? `<button class="btn-delete-comment" onclick="window.CommentsModule.deleteComment(${comment.id})" title="Hapus"><i data-feather="trash-2"></i></button>` : ''}
            </div>
          </div>
          <div class="comment-content">${comment.content}</div>
          
          <!-- Reply Form Placeholder -->
          <div id="replyFormRow-${comment.id}" class="reply-form-row" style="display:none"></div>
        </div>
        ${childrenHTML}
      </div>
    `;
  }

  // ========== TOGGLE REPLY FORM ==========
  function toggleReplyForm(commentId) {
    const row = document.getElementById(`replyFormRow-${commentId}`);
    if (!row) return;

    if (row.style.display === 'block') {
      row.style.display = 'none';
      row.innerHTML = '';
      return;
    }

    // Close any other open reply forms
    document.querySelectorAll('.reply-form-row').forEach(el => {
      el.style.display = 'none';
      el.innerHTML = '';
    });

    row.innerHTML = `
      <div class="comment-form-wrap reply-form">
         <div class="comment-avatar-vs">${avatarLetter(currentUser.name)}</div>
         <div class="comment-input-area">
           <textarea
             id="replyInput-${commentId}"
             class="comment-textarea sm"
             placeholder="Balas komentar ini..."
             maxlength="2000"
             rows="2"
           ></textarea>
           <div class="comment-form-footer">
             <button class="btn-cancel-reply" onclick="window.CommentsModule.toggleReplyForm(${commentId})">Batal</button>
             <button class="btn-comment-submit sm" onclick="window.CommentsModule.submitComment(${currentArticleId}, '${currentArticleType}', ${commentId})">
               <i data-feather="send"></i> Balas
             </button>
           </div>
         </div>
      </div>
    `;
    row.style.display = 'block';
    document.getElementById(`replyInput-${commentId}`).focus();
    if (typeof feather !== 'undefined') feather.replace();
  }

  // ========== SUBMIT COMMENT (Supports Parent) ==========
  async function submitComment(articleId, articleType, parentId = null) {
    const textareaId = parentId ? `replyInput-${parentId}` : 'commentInput';
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content) {
      showCommentToast('Komentar tidak boleh kosong.', 'error');
      return;
    }

    let btn = document.getElementById('submitComment');
    if (parentId) {
      const row = document.getElementById(`replyFormRow-${parentId}`);
      if (row) btn = row.querySelector('.btn-comment-submit');
    }
    
    textarea.disabled = true;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="loading-spinner sm"></span>';
    }

    try {
      const res = await fetch('/ksmaja/api/comments/add.php', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ 
          article_id: articleId, 
          article_type: articleType, 
          content,
          parent_id: parentId
        }),
      });
      const data = await res.json();

      if (data.ok) {
        textarea.value = '';
        if (!parentId) document.getElementById('charCount').textContent = '0';
        showCommentToast('Komentar berhasil dikirim!', 'success');
        await loadComments(articleId, articleType);
      } else {
        showCommentToast(data.message || 'Gagal mengirim komentar.', 'error');
      }
    } catch (e) {
      showCommentToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      textarea.disabled = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-feather="send"></i> ' + (parentId ? 'Balas' : 'Kirim');
        if (typeof feather !== 'undefined') feather.replace();
      }
    }
  }

  // ========== DELETE COMMENT ==========
  async function deleteComment(commentId) {
    const confirmed = confirm('Hapus komentar ini? Balasan di bawahnya juga tidak akan memiliki induk atau terhapus tergantung sistem (saat ini tetap ada tapi jadi top-level jika manual di DB, tapi UI akan menyembunyikan jika parent hilang). Tetap hapus?');
    if (!confirmed) return;

    try {
      const res = await fetch('/ksmaja/api/comments/delete.php', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ comment_id: commentId }),
      });
      const data = await res.json();

      if (data.ok) {
        showCommentToast('Komentar dihapus.', 'success');
        await loadComments(currentArticleId, currentArticleType);
      } else {
        showCommentToast(data.message || 'Gagal menghapus komentar.', 'error');
      }
    } catch (e) {
      showCommentToast('Terjadi kesalahan jaringan.', 'error');
    }
  }

  // ========== HELPERS ==========
  function avatarLetter(name) {
    return (name || 'U').charAt(0).toUpperCase();
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function showCommentToast(message, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(message, type);
      return;
    }
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;color:#fff;background:${type === 'success' ? '#22c55e' : '#ef4444'};`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ========== EXPOSE PUBLIC API ==========
  window.CommentsModule = {
    init:          initComments,
    loadComments,
    submitComment,
    deleteComment,
    toggleReplyForm,
  };

})();
