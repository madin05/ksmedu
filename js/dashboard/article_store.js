// js/dashboard/article_store.js
// Data layer: fetching, normalising, and caching articles.
// Depends on: utils.js  (FALLBACK_COVER, parseJsonField, resolveFirstAuthor,
//                         fetchWithTimeout, resolveDetailPage)

'use strict';

// ─── View-tracking (localStorage) ────────────────────────────────────────────
const viewedArticles = new Set(
  JSON.parse(localStorage.getItem('viewedArticles') || '[]'),
);

function markAsViewed(articleId) {
  viewedArticles.add(String(articleId));
  localStorage.setItem('viewedArticles', JSON.stringify([...viewedArticles]));
}

function hasBeenViewed(articleId) {
  return viewedArticles.has(String(articleId));
}

// ─── Auth helper ─────────────────────────────────────────────────────────────
function checkLoginStatus() {
  return sessionStorage.getItem('userLoggedIn') === 'true';
}

// ─── Article cache (module-level, shared via window.articleStore) ─────────────
/** @type {object[]} */
let articles = [];

// ─── Data fetching ────────────────────────────────────────────────────────────

/** @param {object} j - raw journal row from the API */
function _mapJournal(j) {
  const authors = parseJsonField(j.authors);
  const tags    = parseJsonField(j.tags);
  const cover   = formatPublicUrl(j.cover_url);
  const file    = formatPublicUrl(j.file_url);
  return {
    id:          j.id,
    title:       j.title,
    judul:       j.title,
    abstract:    j.abstract,
    abstrak:     j.abstract,
    authors,
    author:      authors,
    penulis:     authors[0] ?? 'Admin',
    tags,
    date:        j.created_at,
    uploadDate:  j.created_at,
    fileData:    file,
    file_url:    file,
    coverImage:  cover || FALLBACK_COVER,
    cover:       cover,
    views:       j.views || 0,
    type:        'jurnal',
  };
}

/** @param {object} o - raw opinion row from the API */
function _mapOpinion(o) {
  const authors    = typeof parseOpinionAuthors === 'function'
    ? parseOpinionAuthors(o.authors, o.author_name)
    : [o.author_name || 'Anonymous'];
  const authorName = authors[0] || 'Anonymous';
  const tags       = parseJsonField(o.tags);
  const cover      = formatPublicUrl(o.cover_url);
  const file       = formatPublicUrl(o.file_url);
  return {
    id:          o.id,
    title:       o.title,
    judul:       o.title,
    description: o.description,
    abstract:    o.description,
    abstrak:     o.description,
    category:    o.category || 'opini',
    author:      authors,
    authors:     authors,
    penulis:     authorName,
    tags,
    date:        o.created_at,
    uploadDate:  o.created_at,
    coverImage:  cover || FALLBACK_COVER,
    cover:       cover,
    fileUrl:     file,
    fileData:    file,
    file_url:    file,
    views:       o.views || 0,
    type:        'opini',
  };
}

/**
 * Fetches journals + opinions in parallel, normalises, and sorts by date desc.
 * @returns {Promise<object[]>}
 */
async function loadArticles() {
  try {
    console.log('Loading articles from database...');
    const t       = Date.now();
    const noCache = { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } };
    const base    = window.APP_CONFIG.apiBase;

    const [jSettled, oSettled] = await Promise.allSettled([
      fetchWithTimeout(`${base}/list_journals.php?limit=50&offset=0&t=${t}`, noCache)
        .then(r => r.json()),
      fetch(`${base}/list_opinions.php?limit=50&offset=0&t=${t}`, noCache)
        .then(r => r.json()),
    ]);

    const journalsData = jSettled.status === 'fulfilled'
      ? jSettled.value
      : { ok: false, results: [] };

    const opinionsData = oSettled.status === 'fulfilled'
      ? oSettled.value
      : (() => { console.warn('No opinions endpoint, skipping...'); return { ok: false, results: [] }; })();

    const journals = (journalsData.ok && journalsData.results)
      ? journalsData.results.map(_mapJournal) : [];
    const opinions = (opinionsData.ok && opinionsData.results)
      ? opinionsData.results.map(_mapOpinion) : [];

    const sorted = [...journals, ...opinions].sort((a, b) => {
      const dA = new Date(a.uploadDate || a.date || 0);
      const dB = new Date(b.uploadDate || b.date || 0);
      return dB - dA;
    });

    console.log(`Total articles from database: ${sorted.length}`);
    return sorted;
  } catch (error) {
    console.error('Error loading articles from database:', error);
    return [];
  }
}

// ─── View tracking & navigation ───────────────────────────────────────────────

/**
 * Fires-and-forgets a server-side view increment (once per session).
 * @param {string|number} id
 * @param {'jurnal'|'opini'} type
 */
async function updateArticleViews(id, type) {
  try {
    await fetch(`${window.APP_CONFIG.apiBase}/update_views.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, type: type === 'opini' ? 'opinion' : 'journal' }),
    });
    console.log('View updated for:', id);
  } catch (error) {
    console.warn('Failed to update views:', error);
  }
}

/**
 * Navigates to the article detail page, incrementing its view count once.
 * @param {string|number} articleId
 * @param {'jurnal'|'opini'} articleType
 */
function openArticleDetail(articleId, articleType) {
  console.log('Opening article:', articleId, articleType);

  if (!hasBeenViewed(articleId)) {
    updateArticleViews(articleId, articleType);
    markAsViewed(articleId);
  } else {
    console.log('Article already viewed, skipping view count update');
  }

  window.location.href =
    `${resolveDetailPage(articleType)}?id=${articleId}&type=${articleType}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
window.articleStore = {
  get articles()           { return articles; },
  set articles(v)          { articles = v; },
  loadArticles,
  openArticleDetail,
  updateArticleViews,
  hasBeenViewed,
  markAsViewed,
  checkLoginStatus,
};

// expose openArticleDetail globally (called from inline onclick HTML)
window.openArticleDetail = openArticleDetail;
