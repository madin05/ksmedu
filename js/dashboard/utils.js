// js/dashboard/utils.js
// Pure utilities — no DOM, no fetch, no side-effects.
// Loaded first so every downstream module can rely on these.

'use strict';

/** Default cover image used when an article has no cover. */
const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=400&fit=crop';

/**
 * Format relative upload URLs dynamically based on environment (localhost vs VPS)
 * @param {string} url
 * @returns {string}
 */
function formatPublicUrl(url) {
  if (!url || typeof url !== 'string') return '';

  const root = (window.APP_CONFIG && window.APP_CONFIG.ROOT) ? window.APP_CONFIG.ROOT : '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      if (root && parsed.pathname.startsWith('/uploads/') && !parsed.pathname.startsWith(root + '/')) {
        return parsed.origin + root + parsed.pathname;
      }
    } catch (e) {}
    return url;
  }

  let cleanPath = url;
  if (root && cleanPath.startsWith(root + '/')) {
    cleanPath = cleanPath.substring(root.length);
  }
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  return root + cleanPath;
}

/**
 * Safely parses a JSON string field; returns the original value if it is
 * already an array/object, or `fallback` on failure.
 * @param {string|any} value
 * @param {any} [fallback=[]]
 */
function parseJsonField(value, fallback = []) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

const ACADEMIC_DEGREE_PATTERN = new RegExp(
  '^(?:s\\.pd|s\\.e|s\\.t|s\\.kom|s\\.si|s\\.ked|s\\.sos|s\\.ag|s\\.h|s\\.sn|' +
  'm\\.pd|m\\.e|m\\.t|m\\.kom|m\\.si|m\\.m|m\\.a|m\\.h|m\\.sn|m\\.sc|' +
  'ph\\.d|dr|dra|drs|prof|a\\.ks|se|mm|ma|st|spd|skom|msi|mpd)\\.?$',
  'i'
);

function _isAcademicDegree(word) {
  if (!word || typeof word !== 'string') return false;
  const clean = word.replace(/^[,\s.]+|[,\s.]+$/g, '').trim();
  return ACADEMIC_DEGREE_PATTERN.test(clean);
}

/**
 * Normalises single-string or JSON authors for opinions, splitting multiple
 * comma-separated authors while preserving academic degrees.
 * @param {any} rawAuthors
 * @param {string|null} rawAuthorName
 * @returns {string[]}
 */
function parseOpinionAuthors(rawAuthors, rawAuthorName) {
  if (Array.isArray(rawAuthors) && rawAuthors.length > 0) {
    const list = rawAuthors.map((a) => (typeof a === 'string' ? a.trim() : String(a))).filter(Boolean);
    if (list.length > 0) return list;
  }
  if (typeof rawAuthors === 'string' && rawAuthors.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(rawAuthors);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const list = parsed.map((a) => (typeof a === 'string' ? a.trim() : String(a))).filter(Boolean);
        if (list.length > 0) return list;
      }
    } catch (e) {}
  }

  if (!rawAuthorName || typeof rawAuthorName !== 'string') {
    return ['Anonymous'];
  }
  const str = rawAuthorName.trim();
  if (!str) return ['Anonymous'];

  if (/[;\n|]/.test(str)) {
    const list = str.split(/[;\n|]+/).map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) return list;
  }

  const parts = str.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return [str];
  }

  const authors = [];
  let currentAuthor = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const words = part.split(/\s+/).filter(Boolean);
    const allWordsAreDegrees = words.length > 0 && words.every((w) => _isAcademicDegree(w));

    if (currentAuthor && allWordsAreDegrees) {
      currentAuthor += ', ' + part;
    } else {
      if (currentAuthor) {
        authors.push(currentAuthor);
      }
      currentAuthor = part;
    }
  }
  if (currentAuthor) {
    authors.push(currentAuthor);
  }

  return authors.length > 0 ? authors : [str];
}

/**
 * Returns the first author name from any of the known author-related fields.
 * @param {object} article
 * @returns {string}
 */
function resolveFirstAuthor(article) {
  const src = article.authors ?? article.author;
  if (Array.isArray(src) && src.length > 0) return src[0];
  return article.penulis || 'ADMIN';
}

/**
 * Wraps fetch() with a hard timeout via AbortController.
 * @param {string} url
 * @param {RequestInit} [options={}]
 * @param {number} [timeout=8000]
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

/**
 * Escapes a string for safe use inside an HTML attribute value.
 * @param {string|null|undefined} text
 * @returns {string}
 */
function escapeForAttribute(text) {
  return (text || '')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Returns a human-readable relative time string in Bahasa Indonesia.
 * Returns '' for null / undefined / invalid dates.
 * @param {string|Date|null} dateStr
 * @returns {string}
 */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diffMs   = Date.now() - date.getTime();
  const diffMin  = Math.floor(diffMs / 60_000);
  if (diffMin  <  1) return 'Baru saja';
  if (diffMin  < 60) return `${diffMin} menit yang lalu`;
  const diffHour = Math.floor(diffMin  / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  const diffDay  = Math.floor(diffHour / 24);
  if (diffDay  < 30) return `${diffDay} hari yang lalu`;
  return `${Math.floor(diffDay / 30)} bulan yang lalu`;
}

/**
 * Returns the canonical detail-page slug for a given article type.
 * @param {'jurnal'|'opini'} type
 * @returns {'explore_jurnal'|'explore_opini'}
 */
function resolveDetailPage(type) {
  return type === 'opini' ? 'explore_opini' : 'explore_jurnal';
}
