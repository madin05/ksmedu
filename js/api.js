// js/api.js
// API wrapper functions dengan JWT Authentication
// ===== JWT TOKEN MANAGER =====
const TokenManager = {
  ACCESS_TOKEN_KEY: 'jwt_access_token',
  REFRESH_TOKEN_KEY: 'jwt_refresh_token',
  TOKEN_EXPIRY_KEY: 'jwt_token_expiry',

  getAccessToken() {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken, refreshToken, expiresIn) {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
    if (expiresIn) {
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    }
  },

  clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  },

  isTokenExpired() {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    // Add 30 second buffer before actual expiry
    return Date.now() > (parseInt(expiry) - 30000);
  },

  hasTokens() {
    return !!this.getAccessToken();
  },

  /**
   * Get valid access token — auto-refresh if expired
   */
  async getValidToken() {
    if (!this.hasTokens()) return null;

    // If token is not expired, return it
    if (!this.isTokenExpired()) {
      return this.getAccessToken();
    }

    // Token is expired, try to refresh
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      return null;
    }

    try {
      const res = await fetch(`${window.APP_CONFIG.apiBase}/auth_refresh.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      const data = await res.json();

      if (data.ok && data.access_token) {
        this.setTokens(data.access_token, null, data.expires_in);
        console.log('🔄 JWT Access Token refreshed successfully');
        return data.access_token;
      } else {
        console.warn('🔒 Token refresh failed:', data.message);
        this.clearTokens();
        return null;
      }
    } catch (err) {
      console.error('🔒 Token refresh error:', err);
      // Don't clear tokens on network error — might be temporary
      return this.getAccessToken(); // Return possibly expired token, let server decide
    }
  }
};

// Expose globally
window.TokenManager = TokenManager;

// ===== AUTH HEADERS HELPER =====
async function getAuthHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = await TokenManager.getValidToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticated fetch wrapper — auto-injects JWT token
 * Falls back to cookies/session if no token available
 */
async function authFetch(url, options = {}) {
  // Merge auth headers
  const authHeaders = await getAuthHeaders(options.headers || {});

  const config = {
    ...options,
    headers: authHeaders,
    credentials: 'same-origin', // Still send cookies for session fallback
  };

  // If Content-Type is not set and body is not FormData, set it
  if (options.body && !(options.body instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  // For FormData, don't set Content-Type (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  let res = await fetch(url, config);

  // If 401, try refreshing token and retry ONCE
  if (res.status === 401 && TokenManager.hasTokens()) {
    console.log('🔄 Got 401, attempting token refresh and retry...');
    const refreshedToken = await TokenManager.getValidToken();
    if (refreshedToken) {
      config.headers['Authorization'] = `Bearer ${refreshedToken}`;
      res = await fetch(url, config);
    }
  }

  return res;
}

// Set base API URL
window.API_BASE = window.APP_CONFIG.apiBase;

// ===== FILE UPLOAD =====
async function uploadFileToServer(file, onProgress) {
  const endpoint = window.API_BASE + "/upload.php";
  const form = new FormData();
  form.append("file", file);

  try {
    const token = await TokenManager.getValidToken();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);

    // Set JWT header
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Progress tracking
    if (typeof onProgress === "function") {
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          try {
            onProgress(percent, e.loaded, e.total);
          } catch (err) {
            console.warn("Progress callback error:", err);
          }
        }
      };
    }

    // Promise wrapper untuk XMLHttpRequest
    const res = await new Promise((resolve, reject) => {
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (err) {
            reject(new Error("Invalid JSON response"));
          }
        } else if (xhr.status === 401) {
          reject(new Error("Authentication required. Please login."));
        } else {
          reject(new Error("Upload failed: " + xhr.statusText));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(form);
    });

    if (res && res.ok) {
      return { ok: true, url: res.url || null, id: res.id || null };
    }
    return { ok: false, message: res.message || "Upload returned ok=false" };
  } catch (err) {
    console.error("Upload error:", err);
    return { ok: false, message: err.message || "Upload error" };
  }
}

// ===== JOURNAL API =====
async function createJournal(metadata) {
  const endpoint = window.API_BASE + "/create_journal.php";
  try {
    const res = await authFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });
    return await res.json();
  } catch (err) {
    console.error("Create journal error:", err);
    return { ok: false, message: err.message };
  }
}

async function listJournals(limit = 50, offset = 0) {
  const endpoint = `${
    window.API_BASE
  }/list_journals.php?limit=${encodeURIComponent(
    limit
  )}&offset=${encodeURIComponent(offset)}`;
  try {
    const res = await fetch(endpoint);
    return await res.json();
  } catch (err) {
    console.error("List journals error:", err);
    return { ok: false, message: err.message };
  }
}

async function getJournal(id) {
  const endpoint = `${window.API_BASE}/get_journal.php?id=${encodeURIComponent(
    id
  )}`;
  try {
    const res = await fetch(endpoint);
    return await res.json();
  } catch (err) {
    console.error("Get journal error:", err);
    return { ok: false, message: err.message };
  }
}

async function updateJournal(payload) {
  const endpoint = window.API_BASE + "/update_journal.php";
  try {
    let requestConfig = {
      method: "POST",
    };

    // Support both FormData and JSON
    if (payload instanceof FormData) {
      requestConfig.body = payload;
    } else {
      requestConfig.headers = { "Content-Type": "application/json" };
      requestConfig.body = JSON.stringify(payload);
    }

    const res = await authFetch(endpoint, requestConfig);
    return await res.json();
  } catch (err) {
    console.error("Update journal error:", err);
    return { ok: false, message: err.message };
  }
}

async function deleteJournal(id) {
  const endpoint = window.API_BASE + "/delete_journal.php";
  try {
    const res = await authFetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return await res.json();
  } catch (err) {
    console.error("Delete journal error:", err);
    return { ok: false, message: err.message };
  }
}

// ===== OPINION API =====
async function listOpinions(limit = 50, offset = 0, category = null) {
  let endpoint = `${
    window.API_BASE
  }/list_opinions.php?limit=${encodeURIComponent(
    limit
  )}&offset=${encodeURIComponent(offset)}`;

  if (category && category !== "all") {
    endpoint += `&category=${encodeURIComponent(category)}`;
  }

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("List opinions error:", err);
    return { ok: false, message: err.message };
  }
}

// NEW: Support both JSON and FormData
async function createOpinion(opinionData) {
  const endpoint = window.API_BASE + "/create_opinion.php";

  try {
    let requestConfig = {
      method: "POST",
    };

    // Check if opinionData is FormData or plain object
    if (opinionData instanceof FormData) {
      requestConfig.body = opinionData;
    } else {
      requestConfig.headers = { "Content-Type": "application/json" };
      requestConfig.body = JSON.stringify(opinionData);
    }

    const res = await authFetch(endpoint, requestConfig);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Create opinion error:", err);
    return { ok: false, message: err.message };
  }
}

async function getOpinion(id) {
  const endpoint = `${window.API_BASE}/get_opinion.php?id=${encodeURIComponent(
    id
  )}`;
  try {
    const res = await fetch(endpoint);
    return await res.json();
  } catch (err) {
    console.error("Get opinion error:", err);
    return { ok: false, message: err.message };
  }
}

async function updateOpinion(id, updatedData) {
  const endpoint = window.API_BASE + "/update_opinion.php";

  try {
    let requestConfig = {
      method: "POST",
    };

    // Check if updatedData is FormData or plain object
    if (updatedData instanceof FormData) {
      if (!updatedData.has("id")) {
        updatedData.append("id", id);
      }
      requestConfig.body = updatedData;
    } else {
      requestConfig.headers = { "Content-Type": "application/json" };
      requestConfig.body = JSON.stringify({ id, ...updatedData });
    }

    const res = await authFetch(endpoint, requestConfig);
    return await res.json();
  } catch (err) {
    console.error("Update opinion error:", err);
    return { ok: false, message: err.message };
  }
}

async function deleteOpinion(id) {
  const endpoint = `${
    window.API_BASE
  }/delete_opinion.php?id=${encodeURIComponent(id)}`;
  try {
    const res = await authFetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Delete opinion error:", err);
    return { ok: false, message: err.message };
  }
}

// ===== SYNC API =====
async function syncPush(changes) {
  const endpoint = window.API_BASE + "/sync_push.php";
  try {
    const res = await authFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    return await res.json();
  } catch (err) {
    console.error("Sync push error:", err);
    return { ok: false, message: err.message };
  }
}

async function syncPull(since) {
  const endpoint =
    window.API_BASE +
    "/sync_pull.php" +
    (since ? `?since=${encodeURIComponent(since)}` : "");
  try {
    const res = await fetch(endpoint);
    return await res.json();
  } catch (err) {
    console.error("Sync pull error:", err);
    return { ok: false, message: err.message };
  }
}

// ===== UPDATE VIEWS =====
async function updateViews(id, type) {
  const endpoint = window.API_BASE + "/update_views.php";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, type }),
    });
    return await res.json();
  } catch (err) {
    console.error("Update views error:", err);
    return { ok: false, message: err.message };
  }
}

// ===== EXPOSE GLOBALLY =====
// Core auth
window.authFetch = authFetch;
window.getAuthHeaders = getAuthHeaders;

// Journals
window.uploadFileToServer = uploadFileToServer;
window.createJournal = createJournal;
window.listJournals = listJournals;
window.getJournal = getJournal;
window.updateJournal = updateJournal;
window.deleteJournal = deleteJournal;

// Opinions
window.listOpinions = listOpinions;
window.createOpinion = createOpinion;
window.getOpinion = getOpinion;
window.updateOpinion = updateOpinion;
window.deleteOpinion = deleteOpinion;

// Sync
window.syncPush = syncPush;
window.syncPull = syncPull;

// Views
window.updateViews = updateViews;

console.log("🔐 API module loaded with JWT authentication");
