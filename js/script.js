// ===== Toast Helper (Global) =====
function showToast(msg, type = "success", title = "") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "check-circle",
    error: "alert-circle",
    warning: "alert-triangle",
    info: "info",
  };

  const icon = iconMap[type] || "info";
  const toastTitle =
    title || (type === "error" ? "Pesan Kesalahan" : "Informasi");

  toast.innerHTML = `
    <button class="toast-close" title="Tutup">
      <i data-feather="x"></i>
    </button>
    <div class="toast-icon">
      <i data-feather="${icon}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${toastTitle}</div>
      <div class="toast-message">${msg}</div>
    </div>
    <div class="toast-progress">
      <div class="toast-progress-bar"></div>
    </div>
  `;

  container.appendChild(toast);

  // Replace icons
  if (typeof feather !== "undefined") {
    feather.replace();
  }

  // Animate in
  setTimeout(() => toast.classList.add("show"), 100);

  // Close functionality
  const closeToast = () => {
    toast.classList.add("hide");
    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      { once: true },
    );
  };

  toast.querySelector(".toast-close").addEventListener("click", closeToast);

  // Auto remove after time
  const timer = setTimeout(closeToast, 4000);
}

// ===== Global Confirmation Modal (Global) =====
function showConfirm(msg, onConfirm, title = "Konfirmasi Tindakan") {
  let modal = document.getElementById("confirm-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "confirm-modal";
    modal.innerHTML = `
      <div class="confirm-overlay"></div>
      <div class="confirm-content">
        <div class="confirm-icon"><i data-feather="help-circle"></i></div>
        <h3 id="confirm-title">Konfirmasi</h3>
        <p id="confirm-message"></p>
        <div class="confirm-actions">
          <button class="btn-confirm-cancel">Batal</button>
          <button class="btn-confirm-yes">Ya, Lanjutkan</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Replace icons
    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  const titleEl = modal.querySelector("#confirm-title");
  const messageEl = modal.querySelector("#confirm-message");
  const btnYes = modal.querySelector(".btn-confirm-yes");
  const btnCancel = modal.querySelector(".btn-confirm-cancel");
  const overlay = modal.querySelector(".confirm-overlay");

  titleEl.textContent = title;
  messageEl.textContent = msg;

  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  };

  const handleConfirm = () => {
    closeModal();
    if (typeof onConfirm === "function") onConfirm();
  };

  // Assign events (clean previous listeners)
  btnYes.onclick = handleConfirm;
  btnCancel.onclick = closeModal;
  overlay.onclick = closeModal;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// ===== Hash Search Handler =====
function setupHashSearch() {
  if (location.hash === "#search") {
    const search = document.querySelector(".search-box input");
    if (search) {
      setTimeout(() => {
        search.focus();
        search.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }
}

// ===== PREVIEW VIEWER =====
class PreviewViewer {
  constructor() {
    this.modal = document.getElementById("previewModal");
    this.body = document.getElementById("previewBody");
    this.title = document.getElementById("previewTitle");
    this.info = document.getElementById("previewInfo");
    this.closeBtn = document.getElementById("closePreviewModal");
    this.currentId = null;

    if (!this.modal || !this.body) return;

    const overlay = this.modal.querySelector(".modal-overlay");
    overlay?.addEventListener("click", () => this.close());
    this.closeBtn?.addEventListener("click", () => this.close());
  }

  openById(id) {
    this.currentId = id;
    const journal = this.resolveJournal(id);
    if (!journal) {
      showToast("Jurnal tidak ditemukan di sistem.", "error", "DATA TIDAK ADA");
      return;
    }
    this.openWithJournal(journal);
  }

  resolveJournal(id) {
    const idNum = Number(id);
    if (window.journalManager?.journals) {
      const j = window.journalManager.journals.find((x) => x.id === idNum);
      if (j) return j;
    }
    if (window.paginationManager?.journals) {
      const j = window.paginationManager.journals.find((x) => x.id === idNum);
      if (j) return j;
    }
    try {
      const list = JSON.parse(localStorage.getItem("journals") || "[]");
      return list.find((x) => x.id === idNum) || null;
    } catch {
      return null;
    }
  }

  openWithJournal(j) {
    this.title.textContent = j.title || "Untitled";
    const authorsText = Array.isArray(j.author)
      ? j.author.join(", ")
      : j.author || "Unknown";
    this.info.textContent = `${j.date || ""}  ${authorsText}`;
    this.body.innerHTML = "";

    const ext = (j.fileName || "").split(".").pop().toLowerCase();
    const canPreviewPDF = !!j.fileData && ext === "pdf";
    const canPreviewImage =
      !!j.coverImage && /^data:image\//.test(j.coverImage);

    if (canPreviewPDF) {
      const iframe = document.createElement("iframe");
      iframe.src = j.fileData;
      this.body.appendChild(iframe);
    } else if (canPreviewImage) {
      const img = document.createElement("img");
      img.src = j.coverImage;
      this.body.appendChild(img);
    } else {
      const box = document.createElement("div");
      box.className = "preview-fallback";
      box.innerHTML = `
        <div>Preview tidak tersedia untuk tipe file ini (${
          ext || "unknown"
        }).</div>
        <div class="hint">Gunakan menu Download di kartu/list untuk mengunduh file.</div>
      `;
      this.body.appendChild(box);
    }

    this.open();
  }

  open() {
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";
    try {
      feather.replace();
    } catch {}
  }

  close() {
    this.modal.classList.remove("active");
    document.body.style.overflow = "auto";
    this.currentId = null;
    this.body.innerHTML = "";
  }
}

// ===== SEARCH FUNCTIONALITY =====
class SearchManager {
  constructor() {
    this.searchInput = document.querySelector(".search-box input");
    if (this.searchInput) this.setupSearch();
  }

  setupSearch() {
    this.searchInput.addEventListener("input", (e) => {
      this.filterJournals(e.target.value);
    });
  }

  filterJournals(searchTerm) {
    const term = searchTerm.toLowerCase();
    const journalItems = document.querySelectorAll(".journal-item");

    journalItems.forEach((item) => {
      const title =
        item.querySelector(".journal-title")?.textContent.toLowerCase() || "";
      const description =
        item.querySelector(".journal-description")?.textContent.toLowerCase() ||
        "";
      const tags = item.dataset.tags?.toLowerCase() || "";

      if (
        title.includes(term) ||
        description.includes(term) ||
        tags.includes(term)
      ) {
        item.style.display = "flex";
      } else {
        item.style.display = "none";
      }
    });
  }
}

// ===== EDIT JOURNAL MANAGER =====
class EditJournalManager {
  constructor() {
    this.modal = document.getElementById("editModal");
    this.form = document.getElementById("editForm");
    this.closeBtn = document.getElementById("closeEditModal");
    this.cancelBtn = document.getElementById("cancelEdit");
    this.authorsContainer = document.getElementById("editAuthorsContainer");
    this.addAuthorBtn = document.getElementById("editAddAuthorBtn");
    this.pengurusContainer = document.getElementById("editPengurusContainer");
    this.addPengurusBtn = document.getElementById("editAddPengurusBtn");
    this.tagsContainer = document.getElementById("editTagsContainer");
    this.tagInput = document.getElementById("editTagInput");
    this.addTagBtn = document.getElementById("editAddTagBtn");
    this.currentJournalId = null;

    if (!this.modal || !this.form) {
      console.warn("Edit modal not found in DOM");
      return;
    }

    this.init();
  }

  init() {
    this.closeBtn?.addEventListener("click", () => this.closeEditModal());
    this.cancelBtn?.addEventListener("click", () => this.closeEditModal());

    this.modal
      .querySelector(".modal-overlay")
      ?.addEventListener("click", () => {
        this.closeEditModal();
      });

    this.addAuthorBtn?.addEventListener("click", () => {
      this.addAuthorField();
    });

    this.addPengurusBtn?.addEventListener("click", () => {
      this.addPengurusField();
    });

    this.addTagBtn?.addEventListener("click", () => {
      this.addTag();
    });

    this.tagInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addTag();
      }
    });

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleEditSubmit();
    });

    console.log(" EditJournalManager initialized");
  }

  addTag() {
    const tag = this.tagInput.value.trim();

    if (!tag) {
      showToast(
        "Silakan masukkan tag terlebih dahulu.",
        "warning",
        "INPUT KOSONG",
      );
      return;
    }

    const tagElement = document.createElement("span");
    tagElement.className = "tag-item";
    tagElement.innerHTML = `
      ${tag}
      <span class="tag-remove" onclick="this.parentElement.remove()">&times;</span>
    `;

    this.tagsContainer.appendChild(tagElement);
    this.tagInput.value = "";
  }

  addPengurusField() {
    const pengurusGroups = this.pengurusContainer.querySelectorAll(
      ".pengurus-input-group",
    );
    const nextIndex = pengurusGroups.length;

    const pengurusGroup = document.createElement("div");
    pengurusGroup.className = "pengurus-input-group";
    pengurusGroup.dataset.pengurusIndex = nextIndex;

    pengurusGroup.innerHTML = `
      <input type="text" 
             class="pengurus-input" 
             placeholder="Nama Pengurus ${nextIndex + 1}">
      <button type="button" class="btn-remove-pengurus">
        <i data-feather="x"></i>
      </button>
    `;

    this.pengurusContainer.appendChild(pengurusGroup);

    const removeBtn = pengurusGroup.querySelector(".btn-remove-pengurus");
    removeBtn.addEventListener("click", () => {
      pengurusGroup.remove();
      this.updatePengurusPlaceholders();
    });

    if (typeof feather !== "undefined") {
      feather.replace();
    }

    this.updatePengurusPlaceholders();
  }

  updatePengurusPlaceholders() {
    const pengurusGroups = this.pengurusContainer.querySelectorAll(
      ".pengurus-input-group",
    );
    pengurusGroups.forEach((group, index) => {
      const input = group.querySelector(".pengurus-input");
      if (input) {
        input.placeholder = `Nama Pengurus ${index + 1}`;
      }
    });
  }

  openEditModal(journalId) {
    console.log("Opening edit modal for journal ID:", journalId);
    this.fetchJournalData(journalId);
  }

  async fetchJournalData(journalId) {
    try {
      const response = await fetch(
        `${window.APP_CONFIG.apiBase}/get_journal.php?id=${journalId}`,
      );
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.message || "Failed to load journal");
      }

      const journal = result.journal;
      console.log("Journal data loaded:", journal);

      this.currentJournalId = journalId;
      this.currentType = "jurnal";

      document.getElementById("editJournalId").value = journalId;
      document.getElementById("editJudulJurnal").value = journal.title || "";
      document.getElementById("editEmail").value = journal.email || "";
      document.getElementById("editKontak").value = journal.contact || "";
      document.getElementById("editVolume").value = journal.volume || "";
      document.getElementById("editAbstrak").value = journal.abstract || "";

      this.populateTags(journal.tags);
      this.populatePengurus(journal.pengurus);
      this.populateAuthors(journal.authors);

      // Tampilkan kembali field Pengurus dan Volume untuk Jurnal
      const pengurusGroup = document.getElementById("editPengurusGroup");
      if (pengurusGroup) {
        pengurusGroup.style.display = "block";
      }
      const volumeGroup = document.getElementById("editVolumeGroup");
      if (volumeGroup) {
        volumeGroup.style.display = "block";
      }

      this.modal.classList.add("active");
      document.body.style.overflow = "hidden";

      if (typeof feather !== "undefined") {
        feather.replace();
      }
    } catch (error) {
      console.error("Error loading journal:", error);
      showToast(
        "Gagal memuat data jurnal: " + error.message,
        "error",
        "ERROR DATABASE",
      );
    }
  }

  populateTags(tags) {
    if (!this.tagsContainer) return;
    this.tagsContainer.innerHTML = "";

    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === "string" && tags.trim()) {
      try {
        tagsArray = JSON.parse(tags);
      } catch (e) {
        tagsArray = [tags];
      }
    }

    tagsArray.forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.className = "tag-item";
      tagElement.innerHTML = `
        ${tag}
        <span class="tag-remove" onclick="this.parentElement.remove()">&times;</span>
      `;
      this.tagsContainer.appendChild(tagElement);
    });
  }

  populatePengurus(pengurus) {
    if (!this.pengurusContainer) return;
    this.pengurusContainer.innerHTML = "";

    let pengurusArray = [];
    if (Array.isArray(pengurus)) {
      pengurusArray = pengurus;
    } else if (typeof pengurus === "string" && pengurus.trim()) {
      try {
        pengurusArray = JSON.parse(pengurus);
      } catch (e) {
        pengurusArray = [pengurus];
      }
    }

    if (pengurusArray.length === 0) {
      this.addPengurusField();
      return;
    }

    pengurusArray.forEach((name, index) => {
      const pengurusGroup = document.createElement("div");
      pengurusGroup.className = "pengurus-input-group";
      pengurusGroup.dataset.pengurusIndex = index;

      pengurusGroup.innerHTML = `
        <input type="text" 
               class="pengurus-input" 
               placeholder="Nama Pengurus ${index + 1}" 
               value="${name || ""}">
        <button type="button" class="btn-remove-pengurus" style="display: ${index === 0 ? "none" : "flex"}">
          <i data-feather="x"></i>
        </button>
      `;

      this.pengurusContainer.appendChild(pengurusGroup);

      const removeBtn = pengurusGroup.querySelector(".btn-remove-pengurus");
      removeBtn.addEventListener("click", () => {
        pengurusGroup.remove();
        this.updatePengurusPlaceholders();
      });
    });

    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  populateAuthors(authors) {
    if (!this.authorsContainer) return;
    this.authorsContainer.innerHTML = "";

    let authorsArray = [];
    if (Array.isArray(authors)) {
      authorsArray = authors;
    } else if (typeof authors === "string" && authors.trim()) {
      try {
        authorsArray = JSON.parse(authors);
      } catch (e) {
        authorsArray = [authors];
      }
    }

    if (authorsArray.length === 0) {
      authorsArray = [""];
    }

    authorsArray.forEach((author, index) => {
      const authorGroup = document.createElement("div");
      authorGroup.className = "author-input-group";
      authorGroup.dataset.authorIndex = index;

      authorGroup.innerHTML = `
        <input type="text" 
               class="author-input" 
               placeholder="Nama Penulis ${index + 1}" 
               value="${author || ""}"
               ${index === 0 ? "required" : ""}>
        <button type="button" class="btn-remove-author" style="display: ${
          index === 0 && authorsArray.length === 1 ? "none" : "flex"
        }">
          <i data-feather="x"></i>
        </button>
      `;

      this.authorsContainer.appendChild(authorGroup);

      const removeBtn = authorGroup.querySelector(".btn-remove-author");
      removeBtn.addEventListener("click", () => {
        this.removeAuthorField(authorGroup);
      });
    });

    if (typeof feather !== "undefined") {
      feather.replace();
    }
  }

  addAuthorField() {
    const authorGroups = this.authorsContainer.querySelectorAll(
      ".author-input-group",
    );
    const nextIndex = authorGroups.length;

    const authorGroup = document.createElement("div");
    authorGroup.className = "author-input-group";
    authorGroup.dataset.authorIndex = nextIndex;

    authorGroup.innerHTML = `
      <input type="text" 
             class="author-input" 
             placeholder="Nama Penulis ${nextIndex + 1}">
      <button type="button" class="btn-remove-author">
        <i data-feather="x"></i>
      </button>
    `;

    this.authorsContainer.appendChild(authorGroup);

    const removeBtn = authorGroup.querySelector(".btn-remove-author");
    removeBtn.addEventListener("click", () => {
      this.removeAuthorField(authorGroup);
    });

    if (typeof feather !== "undefined") {
      feather.replace();
    }

    this.updateAuthorButtons();
  }

  removeAuthorField(authorGroup) {
    const authorGroups = this.authorsContainer.querySelectorAll(
      ".author-input-group",
    );
    if (authorGroups.length <= 1) {
      showToast(
        "Minimal harus ada satu penulis untuk artikel.",
        "warning",
        "VALIDASI GAGAL",
      );
      return;
    }
    authorGroup.remove();
    this.updateAuthorButtons();
  }

  updateAuthorButtons() {
    const authorGroups = this.authorsContainer.querySelectorAll(
      ".author-input-group",
    );
    authorGroups.forEach((group, index) => {
      const removeBtn = group.querySelector(".btn-remove-author");
      if (removeBtn) {
        removeBtn.style.display =
          index === 0 && authorGroups.length === 1 ? "none" : "flex";
      }

      const input = group.querySelector(".author-input");
      if (input) {
        input.placeholder = `Nama Penulis ${index + 1}`;
        input.required = index === 0;
      }
    });
  }

  async handleEditSubmit() {
    const authors = this.getAuthors();
    if (authors.length === 0) {
      showToast(
        "Minimal harus ada satu penulis untuk artikel.",
        "warning",
        "VALIDASI GAGAL",
      );
      return;
    }

    const judul = document.getElementById("editJudulJurnal").value.trim();
    const abstrak = document.getElementById("editAbstrak").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const contact = document.getElementById("editKontak").value.trim();
    const volume = document.getElementById("editVolume").value.trim();

    if (!judul || !abstrak) {
      showToast("Judul dan abstrak wajib diisi.", "warning", "VALIDASI GAGAL");
      return;
    }

    const tags = this.getTags();
    if (tags.length === 0) {
      showToast("Minimal harus ada satu tag.", "warning", "VALIDASI GAGAL");
      return;
    }
    const pengurus = this.getPengurus();

    try {
      const isOpini =
        this.currentType === "opini" ||
        this.modal?.dataset.type === "opini";

      const targetEndpoint = isOpini
        ? `${window.APP_CONFIG.apiBase}/update_opinion.php`
        : `${window.APP_CONFIG.apiBase}/update_journal.php`;

      const formData = new FormData();

      formData.append("id", this.currentJournalId);

      if (judul) formData.append("title", judul);
      if (abstrak) {
        if (isOpini) {
          formData.append("description", abstrak);
        } else {
          formData.append("abstract", abstrak);
        }
      }
      if (email) formData.append("email", email);
      if (contact) formData.append("contact", contact);
      if (!isOpini && volume) formData.append("volume", volume);

      if (authors.length > 0)
        formData.append("authors", JSON.stringify(authors));
      if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
      if (!isOpini && pengurus.length > 0)
        formData.append("pengurus", JSON.stringify(pengurus));

      const fileInput = document.getElementById("editFileInput");
      if (fileInput && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
        console.log("Uploading new file:", fileInput.files[0].name);
      }

      const coverInput = document.getElementById("editCoverInput");
      if (coverInput && coverInput.files[0]) {
        formData.append("cover", coverInput.files[0]);
        console.log("Uploading new cover:", coverInput.files[0].name);
      }

      this.showLoading("Menyimpan perubahan...");

      // Use authFetch if available for JWT support
      const fetchFn = window.authFetch || fetch;
      const response = await fetchFn(targetEndpoint, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.message || "Gagal menyimpan perubahan");
      }

      this.hideLoading();

      showToast(
        isOpini
          ? "Artikel opini berhasil diperbarui."
          : "Perubahan jurnal telah disimpan ke sistem.",
        "success",
        "UPDATE BERHASIL",
      );
      this.closeEditModal();

      // Dispatch event to refresh lists without reload
      window.dispatchEvent(
        new CustomEvent("journals:changed", {
          detail: { id: this.currentJournalId, action: "updated" },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("opinions:changed", {
          detail: { id: this.currentJournalId, action: "updated" },
        }),
      );

      if (window.statisticManager) {
        window.statisticManager.fetchStatistics();
      }
    } catch (error) {
      console.error("Edit journal error:", error);
      this.hideLoading();
      showToast(
        "Gagal memperbarui data: " + error.message,
        "error",
        "UPDATE GAGAL",
      );
    }
  }

  showLoading(message) {
    let overlay = document.getElementById("editLoadingOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "editLoadingOverlay";
      overlay.innerHTML = `
        <div class="loader"></div>
        <p class="loading-message">${message}</p>
      `;
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 10000; color: white;
      `;

      if (!document.getElementById("loader-style")) {
        const style = document.createElement("style");
        style.id = "loader-style";
        style.textContent = `
          .loader {
            width: 60px;
            height: 60px;
            position: relative;
            margin-bottom: 20px;
          }
          .loader::before {
            content: "";
            box-sizing: border-box;
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border-top: 3px solid #8900FF;
            border-right: 3px solid transparent;
            animation: spinner8217 0.8s linear infinite;
          }
          @keyframes spinner8217 {
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(overlay);
    } else {
      overlay.querySelector(".loading-message").textContent = message;
      overlay.style.display = "flex";
    }
  }

  hideLoading() {
    const overlay = document.getElementById("editLoadingOverlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  }

  getTags() {
    const tagElements = this.tagsContainer.querySelectorAll(".tag-item");
    const tags = [];
    tagElements.forEach((tagEl) => {
      const text = tagEl.textContent.replace("×", "").trim();
      if (text) tags.push(text);
    });
    return tags;
  }

  getPengurus() {
    const pengurusInputs =
      this.pengurusContainer.querySelectorAll(".pengurus-input");
    const pengurus = [];
    pengurusInputs.forEach((input) => {
      const value = input.value.trim();
      if (value) pengurus.push(value);
    });
    return pengurus;
  }

  getAuthors() {
    const authorInputs =
      this.authorsContainer.querySelectorAll(".author-input");
    const authors = [];
    authorInputs.forEach((input) => {
      const value = input.value.trim();
      if (value) authors.push(value);
    });
    return authors;
  }

  closeEditModal() {
    this.modal.classList.remove("active");
    document.body.style.overflow = "auto";
    this.currentJournalId = null;
    this.form.reset();

    if (this.tagsContainer) this.tagsContainer.innerHTML = "";
    if (this.pengurusContainer) this.pengurusContainer.innerHTML = "";
    if (this.authorsContainer) this.authorsContainer.innerHTML = "";
  }
}

// ===== LOGIN STATUS SYNC =====
function syncLoginStatusUI() {
  const isLoggedIn = sessionStorage.getItem("userLoggedIn") === "true";
  const isAdmin = sessionStorage.getItem("userType") === "admin";

  window.dispatchEvent(
    new CustomEvent("loginStatusChanged", {
      detail: { isLoggedIn, isAdmin },
    }),
  );

  // Jangan render paksa jika masih loading data dari database
  if (
    window.journalManager &&
    !window.journalManager.isLoading &&
    typeof window.journalManager.renderJournals === "function"
  ) {
    window.journalManager.renderJournals();
  }

  if (
    window.paginationManager &&
    !window.paginationManager.isLoading &&
    typeof window.paginationManager.render === "function"
  ) {
    window.paginationManager.render();
  }
}

// ===== GLOBAL DELETE JOURNAL =====
window.deleteJournal = async function (id, title) {
  if (!id) {
    if (typeof showAlert !== "undefined") {
      showAlert.warning("ID journal tidak valid", "ID Tidak Valid");
    } else {
      alert("ID journal tidak valid");
    }
    return;
  }
  const confirmMsg = title
    ? `Yakin ingin menghapus jurnal "${title}"?\n\nData akan dihapus permanent dari database!`
    : `Yakin ingin menghapus jurnal ini?\n\nData akan dihapus permanent dari database!`;

  let confirmed = false;
  if (typeof showAlert !== "undefined" && typeof showAlert.confirm === "function") {
    confirmed = await showAlert.confirm(confirmMsg, "Konfirmasi Hapus");
  } else {
    confirmed = confirm(confirmMsg);
  }
  if (!confirmed) return;

  const card = document.querySelector(
    `[data-journal-id="${id}"], [data-jurnal-id="${id}"]`
  );
  if (card) {
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
  }

  try {
    const fetchFn = window.authFetch || fetch;
    const response = await fetchFn(
      `${window.APP_CONFIG.apiBase}/delete_journal.php?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();
    if (result.ok) {
      if (typeof showAlert !== "undefined") {
        showAlert.success("Jurnal berhasil dihapus!", "Sukses");
      } else if (typeof showToast === "function") {
        showToast("Jurnal berhasil dihapus!", "success");
      }
      window.dispatchEvent(
        new CustomEvent("journals:changed", {
          detail: { action: "deleted", id: id },
        })
      );
      if (card) {
        card.remove();
      }
      if (window.statisticManager) {
        setTimeout(async () => {
          await window.statisticManager.fetchStatistics();
        }, 500);
      }
    } else {
      throw new Error(result.message || "Gagal menghapus jurnal dari database");
    }
  } catch (error) {
    if (typeof showAlert !== "undefined") {
      showAlert.error("Gagal menghapus jurnal: " + error.message, "Error");
    } else {
      alert("Gagal menghapus jurnal: " + error.message);
    }
    if (card) {
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
    }
  }
};

// ===== GLOBAL DELETE OPINION =====
window.deleteOpinion = async function (id, title) {
  const confirmed = await showAlert.confirm(
    `Yakin ingin menghapus opini "${title}"?`,
    "Konfirmasi Hapus",
  );
  if (!confirmed) return;

  const card = document.querySelector(
    `[data-opinion-id="${id}"], [data-opini-id="${id}"], [data-journal-id="${id}"]`
  );
  if (card) {
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
  }

  try {
    // Use authFetch for JWT support
    const fetchFn = window.authFetch || fetch;
    const response = await fetchFn(`${window.APP_CONFIG.apiBase}/delete_opinion.php?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (result.ok) {
      showToast(
        "Artikel opini telah dihapus selamanya.",
        "success",
        "HAPUS BERHASIL",
      );
      window.dispatchEvent(
        new CustomEvent("opinions:changed", {
          detail: { id: id, action: "deleted" },
        }),
      );
      if (card) {
        card.remove();
      }
      if (window.statisticManager) {
        setTimeout(async () => {
          await window.statisticManager.fetchStatistics();
        }, 500);
      }
    } else {
      throw new Error(result.message || "Gagal menghapus");
    }
  } catch (error) {
    showToast(
      "Gagal menghapus artikel: " + error.message,
      "error",
      "HAPUS GAGAL",
    );
    if (card) {
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
    }
  }
};

// ===== GLOBAL EDIT OPINION =====
window.openEditOpinionModal = async function (id) {
  try {
    const response = await fetch(`${window.APP_CONFIG.apiBase}/get_opinion.php?id=${id}`);
    const result = await response.json();
    if (!result.ok) throw new Error("Gagal load data opini");

    const o = result.result || result.opinion;

    document.getElementById("editJournalId").value = id;
    document.getElementById("editJudulJurnal").value = o.title || "";
    document.getElementById("editEmail").value = o.email || "";
    document.getElementById("editKontak").value = o.contact || "";
    document.getElementById("editAbstrak").value = o.description || "";

    // Panggil method EditJournalManager untuk render Tags dan Penulis (Pengurus di skip)
    if (window.editJournalManager) {
      window.editJournalManager.currentJournalId = id;
      window.editJournalManager.currentType = "opini";
      window.editJournalManager.populateTags(o.tags || []);
      const authors = o.author || o.authors || ["Anonymous"];
      window.editJournalManager.populateAuthors(authors);
      // Kosongkan pengurus karena Opini tidak ada pengurus
      window.editJournalManager.populatePengurus([]);
    }

    // Sembunyikan field Pengurus dan Volume untuk Opini
    const pengurusGroup = document.getElementById("editPengurusGroup");
    if (pengurusGroup) {
      pengurusGroup.style.display = "none";
    }
    const volumeGroup = document.getElementById("editVolumeGroup");
    if (volumeGroup) {
      volumeGroup.style.display = "none";
    }

    // Flag sebagai opini
    document.getElementById("editModal").dataset.type = "opini";
    document.getElementById("editModal").classList.add("active");
    document.body.style.overflow = "hidden";

    if (typeof feather !== "undefined") feather.replace();
  } catch (error) {
    showToast(
      "Gagal memuat data artikel: " + error.message,
      "error",
      "ERROR LOAD",
    );
  }
};

window.addEventListener("adminLoginStatusChanged", syncLoginStatusUI);

// ===== SORT & SEARCH FOR OPINIONS PAGE =====
function setupOpinionsPageControls() {
  // Search functionality
  const searchInput = document.getElementById("searchInput");
  if (searchInput && window.journalManager) {
    searchInput.addEventListener("input", (e) => {
      window.journalManager.searchJournals(e.target.value);
    });
  }

  // Sort dropdown (icon button)
  const btnSort = document.getElementById("btnSort");
  const sortMenu = document.getElementById("sortMenu");

  if (btnSort && sortMenu) {
    btnSort.addEventListener("click", () => {
      sortMenu.classList.toggle("active");
    });

    // Sort items
    const sortItems = sortMenu.querySelectorAll(".sort-item");
    sortItems.forEach((item) => {
      item.addEventListener("click", () => {
        const sortType = item.getAttribute("data-sort");

        // Update active state
        sortItems.forEach((si) => si.classList.remove("active"));
        item.classList.add("active");

        // Close menu
        sortMenu.classList.remove("active");

        // Apply sort
        if (window.journalManager) {
          window.journalManager.sortJournals(sortType);
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!btnSort.contains(e.target) && !sortMenu.contains(e.target)) {
        sortMenu.classList.remove("active");
      }
    });
  }

  // Update total count
  if (window.journalManager) {
    const totalEl = document.getElementById("totalJournals");
    if (totalEl) {
      setTimeout(() => {
        totalEl.textContent = window.journalManager.getTotalCount();
      }, 500);
    }
  }
}

// ===== INITIALIZE ALL SYSTEMS =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready, initializing...");

  // Clear localStorage cache
  localStorage.removeItem("journals");
  localStorage.removeItem("opinions");

  setupHashSearch();

  // Initialize feather icons
  if (typeof feather !== "undefined") {
    feather.replace();
  }

  // Initialize Login Manager
  if (typeof LoginManager !== "undefined") {
    window.loginManager = new LoginManager();
  }

  if (
    document.querySelector(".upload-tab") &&
    typeof UploadTabsManager !== "undefined"
  ) {
    window.uploadTabsManager = new UploadTabsManager();
    console.log(" UploadTabsManager initialized");
  }

  // Page: journals.php  (also matched when served as the clean URL /admin/journals)
  if (ksmPagePath().includes("journals.php")) {
    if (typeof EditJournalManager !== "undefined")
      window.editJournalManager = new EditJournalManager();
    if (typeof PaginationManager !== "undefined") {
      window.paginationManager = new PaginationManager({
        containerSelector: "#journalContainer",
        paginationSelector: "#pagination",
        searchInputSelector: "#searchInput",
        sortSelectSelector: "#sortSelect",
        filterSelectSelector: "#filterSelect",
        itemsPerPage: 9,
        dataType: "jurnal",
      });
    }
    window.previewViewer = new PreviewViewer();
    syncLoginStatusUI();
    return;
  }

  // Page: opinions.php (ADMIN MODE) - clean URL /admin/opinions included
  if (ksmPagePath().includes("opinions.php")) {
    if (typeof EditJournalManager !== "undefined") {
      window.editJournalManager = new EditJournalManager();
    }

    // Override submit untuk opini
    const editForm = document.getElementById("editForm");
    if (editForm) {
      editForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const id = document.getElementById("editJournalId").value;
        const formData = new FormData();
        formData.append("id", id);
        formData.append(
          "title",
          document.getElementById("editJudulJurnal").value,
        );
        formData.append(
          "description",
          document.getElementById("editAbstrak").value,
        );
        formData.append("email", document.getElementById("editEmail").value);
        formData.append("contact", document.getElementById("editKontak").value);
        const fileInput = document.getElementById("editFileInput");
        if (fileInput?.files[0]) formData.append("file", fileInput.files[0]);
        const coverInput = document.getElementById("editCoverInput");
        if (coverInput?.files[0]) formData.append("cover", coverInput.files[0]);

        // Tambahkan support untuk Penulis dan Tags
        if (window.editJournalManager) {
          const authors = window.editJournalManager.getAuthors();
          if (authors.length > 0)
            formData.append("authors", JSON.stringify(authors));

          const tags = window.editJournalManager.getTags();
          if (tags.length === 0) {
            showToast(
              "Minimal harus ada satu tag.",
              "warning",
              "VALIDASI GAGAL",
            );
            return;
          }
          formData.append("tags", JSON.stringify(tags));
        }

        try {
          // Use authFetch for JWT support
          const fetchFn = window.authFetch || fetch;
          const response = await fetchFn(`${window.APP_CONFIG.apiBase}/update_opinion.php`, {
            method: "POST",
            body: formData,
          });
          const result = await response.json();
          if (result.ok) {
            showToast(
              "Artikel opini berhasil diperbarui.",
              "success",
              "UPDATE BERHASIL",
            );
            document.getElementById("editModal").classList.remove("active");
            document.body.style.overflow = "auto";

            // Dispatch event to refresh lists without reload
            window.dispatchEvent(
              new CustomEvent("opinions:changed", {
                detail: { id: id, action: "updated" },
              }),
            );

            if (window.statisticManager) {
              window.statisticManager.fetchStatistics();
            }
          } else {
            throw new Error(result.message);
          }
        } catch (err) {
          showToast(
            "Gagal update opini: " + err.message,
            "error",
            "UPDATE GAGAL",
          );
        }
      });
    }

    if (typeof PaginationManager !== "undefined") {
      window.paginationManager = new PaginationManager({
        containerSelector: "#journalContainer",
        paginationSelector: "#pagination",
        searchInputSelector: "#searchInput",
        sortSelectSelector: "#sortSelect",
        filterSelectSelector: "#filterSelect",
        itemsPerPage: 9,
        dataType: "opini",
      });
    }
    return;
  }

  // Page: opinions_user.php (USER MODE)
  if (
    ksmPagePath().includes("opinions_user.php") ||
    document.getElementById("opinionsContainer")
  ) {
    console.log("Opinions page (USER MODE) detected");
    return;
  }

  // Search initialization
  if (typeof SearchManager !== "undefined")
    window.searchManager = new SearchManager();

  if (typeof EditJournalManager !== "undefined")
    window.editJournalManager = new EditJournalManager();

  window.previewViewer = new PreviewViewer();

  if (window.loginManager) {
    window.loginManager.syncLoginStatus();
  }

  syncLoginStatusUI();


  console.log(" All systems initialized successfully");
});

console.log("script.js loaded");

// ===== AVATAR COLOR HELPER =====
const AVATAR_COLORS = [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#ff7043', // Deep Orange
    '#0ea5e9', // Sky
];

function getAvatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

// =========================================================
// ===== NAVBAR AUTH DYNAMIC CONTENT (ANTI-FLICKER) =====
//
// Sebelumnya navbar profil (avatar+nama) selalu kosong dulu di setiap
// halaman baru, baru "muncul" setelah fetch ke auth_me.php selesai —
// urutan kosong->muncul itu yang kelihatan seperti kedipan/glitch
// setiap pindah halaman.
//
// Sekarang: begitu profil berhasil dimuat, disimpan ke localStorage.
// Di kunjungan halaman berikutnya, render DULU dari cache itu secara
// instan (tanpa nunggu server), sambil tetap fetch data asli di
// belakang layar untuk validasi. Kalau ternyata beda/logout, hasil
// fetch otomatis menimpa tampilan cache begitu selesai.
// =========================================================

// Cache dipisah per konteks (user vs admin) mengikuti pemisahan key JWT &
// cookie session di services/auth_context.php. Dengan satu key bersama,
// profil admin bisa "bocor" terender di navbar area user (dan sebaliknya).
const NAVBAR_PROFILE_CACHE_BASE = 'ksm_navbar_profile_cache';

function navbarProfileCacheKey() {
    return ksmAuthContext() === 'admin'
        ? NAVBAR_PROFILE_CACHE_BASE + '_admin'
        : NAVBAR_PROFILE_CACHE_BASE;
}

function getCachedNavbarProfile() {
    try {
        const raw = localStorage.getItem(navbarProfileCacheKey());
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function setCachedNavbarProfile(user) {
    try {
        localStorage.setItem(navbarProfileCacheKey(), JSON.stringify(user));
    } catch (e) {
        /* localStorage penuh/tidak tersedia — abaikan, bukan fatal */
    }
}

function clearCachedNavbarProfile() {
    try {
        localStorage.removeItem(navbarProfileCacheKey());
    } catch (e) {}
}


// =========================================================
// LOGOUT MANDIRI (tidak bergantung pada TokenManager/api.js)
//
// LATAR MASALAH (bug "tidak bisa logout"):
//  1. Banyak halaman user (profil, pengaturan, kontak, tentang, dll) TIDAK
//     memuat js/api.js, jadi window.TokenManager undefined. Akibatnya header
//     Authorization tidak dikirim (token tak masuk blacklist) DAN
//     localStorage jwt_access_token/jwt_refresh_token tidak pernah dihapus.
//     Setelah redirect, auth_me.php masih menerima JWT lama -> user tampak
//     tetap login meski sudah menekan Logout.
//  2. Pembersihan storage + redirect hanya dilakukan bila `out.ok === true`.
//     Bila respons bukan JSON valid (di lokal XAMPP display_errors sering
//     menyisipkan warning/notice ke body) res.json() melempar error, sehingga
//     tombol Logout versi mobile tidak melakukan apa pun.
//
// SOLUSI: baca/bersihkan token langsung dari localStorage dengan key yang
// identik dengan TokenManager (js/api.js) & AuthStorage (js/auth_storage.js),
// lalu SELALU bersihkan state klien dan redirect apa pun hasil responsnya.
// =========================================================

function ksmAuthContext() {
    try {
        return /(^|\/)admin\//.test(window.location.pathname) ? 'admin' : 'user';
    } catch (e) {
        return 'user';
    }
}

function ksmTokenKeys() {
    const suffix = ksmAuthContext() === 'admin' ? '_admin' : '';
    return {
        access: 'jwt_access_token' + suffix,
        refresh: 'jwt_refresh_token' + suffix,
        expiry: 'jwt_token_expiry' + suffix,
    };
}

function ksmReadLocal(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function ksmRemoveLocal(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {}
}

function ksmWriteLocal(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {}
}

// =========================================================
// RESOLVER TOKEN MANDIRI (BUGFIX: "sudah login tapi halaman lain guest")
// ---------------------------------------------------------
// PENYEBAB BUG: updateNavbarAuth() hanya mengirim header Authorization bila
// window.TokenManager (js/api.js) tersedia. Halaman seperti journals_user,
// opinions_user, tentang_user, kontak_user, explore_* HANYA memuat script.js
// tanpa api.js, jadi JWT di localStorage tidak pernah ikut dikirim. Halaman
// itu bergantung sepenuhnya pada cookie session PHP; begitu session PHP tidak
// ada / kedaluwarsa (login JWT-only, verifikasi OTP, session gc, cookie
// KSMEDUSESS hilang), auth_me.php menjawab 401 dan navbar berubah jadi Guest —
// padahal sesi JWT masih sah. Hasilnya: dashboard tampak login, menu lain tidak.
//
// SOLUSI: resolver token yang tidak bergantung pada api.js, lengkap dengan
// refresh (rotasi) sendiri. Bila api.js ADA, jalur rotasi tetap didelegasikan
// ke TokenManager agar tidak ada dua permintaan refresh paralel yang saling
// mencabut refresh token.
// =========================================================

// Satu promise refresh dibagi ke semua pemanggil: rotasi refresh token di
// server bersifat sekali pakai, jadi dua request paralel akan saling mematikan.
let ksmRefreshInFlight = null;

function ksmAccessTokenExpired() {
    const expiry = ksmReadLocal(ksmTokenKeys().expiry);
    if (!expiry) return true; // tanpa info kedaluwarsa, anggap perlu divalidasi
    const ts = parseInt(expiry, 10);
    if (!Number.isFinite(ts)) return true;
    return Date.now() > (ts - 30000); // buffer 30 detik
}

async function ksmRefreshAccessToken() {
    const keys = ksmTokenKeys();
    const refreshToken = ksmReadLocal(keys.refresh);
    if (!refreshToken) return null;
    if (ksmRefreshInFlight) return ksmRefreshInFlight;

    ksmRefreshInFlight = (async () => {
        try {
            const res = await fetch(`${window.APP_CONFIG.apiBase}/auth_refresh.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-KSM-Context': ksmAuthContext(),
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            const data = await res.json();
            if (data && data.ok && data.access_token) {
                ksmWriteLocal(keys.access, data.access_token);
                // Refresh token dirotasi server: yang baru WAJIB disimpan.
                if (data.refresh_token) ksmWriteLocal(keys.refresh, data.refresh_token);
                if (data.expires_in) {
                    ksmWriteLocal(keys.expiry, String(Date.now() + (data.expires_in * 1000)));
                }
                return data.access_token;
            }
            return null;
        } catch (err) {
            return null; // gangguan jaringan — token lama tetap dipakai
        } finally {
            ksmRefreshInFlight = null;
        }
    })();

    return ksmRefreshInFlight;
}

/**
 * Ambil access token yang layak dipakai untuk konteks halaman aktif.
 * @param {boolean} [forceRefresh] paksa rotasi (dipakai saat dapat 401)
 * @returns {Promise<string|null>}
 */
async function ksmGetValidAccessToken(forceRefresh) {
    const keys = ksmTokenKeys();

    if (window.TokenManager && typeof window.TokenManager.getValidToken === 'function') {
        try {
            if (forceRefresh) {
                const rotated = await ksmRefreshAccessToken();
                if (rotated) return rotated;
            }
            const managed = await window.TokenManager.getValidToken();
            if (managed) return managed;
        } catch (err) {
            // lanjut ke jalur mandiri di bawah
        }
    }

    const current = ksmReadLocal(keys.access);
    if (!current) return null;
    if (!forceRefresh && !ksmAccessTokenExpired()) return current;

    const refreshed = await ksmRefreshAccessToken();
    // Kalau refresh gagal, tetap kirim token lama: server yang memutuskan.
    return refreshed || current;
}

window.ksmGetValidAccessToken = ksmGetValidAccessToken;


// Hapus seluruh jejak sesi di sisi klien untuk konteks aktif.
function ksmClearClientSession() {
    const keys = ksmTokenKeys();
    ksmRemoveLocal(keys.access);
    ksmRemoveLocal(keys.refresh);
    ksmRemoveLocal(keys.expiry);
    ksmRemoveLocal('currentUser');
    ksmRemoveLocal('authToken');
    ksmRemoveLocal('adminLoggedIn');
    ksmRemoveLocal('adminLoginTime');
    clearCachedNavbarProfile();

    // Biarkan TokenManager membersihkan state internalnya bila api.js dimuat.
    if (window.TokenManager && typeof window.TokenManager.clearTokens === 'function') {
        try { window.TokenManager.clearTokens(); } catch (e) {}
    }

    try { sessionStorage.clear(); } catch (e) {}
}

/**
 * Jalankan logout: blacklist token di server (best effort), bersihkan state
 * klien, lalu redirect. Pembersihan & redirect tidak pernah dibatalkan oleh
 * kegagalan jaringan/respons agar tombol Logout selalu berfungsi.
 *
 * @param {string} [redirectUrl] tujuan setelah logout
 */
async function performLogout(redirectUrl) {
    const target = redirectUrl
        || (window.location.origin + window.APP_CONFIG.root + '/user/dashboard');
    const keys = ksmTokenKeys();
    const accessToken = ksmReadLocal(keys.access);
    const refreshToken = ksmReadLocal(keys.refresh);

    const headers = {
        'Content-Type': 'application/json',
        'X-KSM-Context': ksmAuthContext(),
    };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const body = {};
    if (refreshToken) body.refresh_token = refreshToken;

    try {
        await fetch(`${window.APP_CONFIG.apiBase}/auth_logout.php`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify(body),
        });
    } catch (err) {
        // Server tidak terjangkau — sesi lokal tetap dibersihkan di bawah.
        console.error('Logout request error:', err);
    } finally {
        ksmClearClientSession();
        window.location.href = target;
    }
}


// Dipisah jadi fungsi sendiri supaya bisa dipakai dua kali: sekali untuk
// render instan dari cache (sebelum fetch selesai), sekali lagi untuk
// render data asli setelah fetch selesai (validasi).
function buildNavbarProfileHTML(user) {
    const avatarChar = (user.name || 'U').charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(user.name);
    const logoutUrl = `${window.APP_CONFIG.apiBase}/auth_logout.php?redirect=${encodeURIComponent(window.location.origin + window.APP_CONFIG.root + '/user/dashboard')}`;

    // ===== PROFILE DROPDOWN (Profil Saya / Jurnal Saya / Riwayat Token / Pengaturan / Logout) =====
    // NOTE: trigger di navbar sekarang HANYA avatar + caret (tanpa
    // nama) supaya nama yang sangat panjang tidak merusak layout
    // navbar. Nama & email lengkap dipindah ke bagian header di
    // dalam dropdown-nya sendiri, yang punya lebar tetap sehingga
    // aman dipotong dengan ellipsis kalau kepanjangan.
    // Pakai class (bukan id) untuk trigger & menu karena bisa ada
    // lebih dari satu authContainer (desktop + beberapa
    // .nav-auth-section di drawer mobile). Toggle buka/tutupnya
    // ditangani oleh setupProfileDropdownToggle() lewat event
    // delegation di bawah, supaya tidak perlu daftar listener ulang
    // tiap render.
    const profileHTML = `
        <div class="user-profile">
            <button type="button" class="user-profile-trigger" aria-label="Menu akun ${user.name}" title="${user.name}">
                <span class="user-avatar" style="background: ${avatarColor}">${avatarChar}</span>
                <svg class="user-profile-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="user-profile-menu">
                <div class="user-profile-menu-header">
                    <strong>${user.name}</strong>
                    <span>${user.email}</span>
                </div>
                <a href="profile" class="user-profile-menu-item">
                    <i data-feather="user"></i> Profil Saya
                </a>
                <a href="my_journals" class="user-profile-menu-item">
                    <i data-feather="file-text"></i> Jurnal Saya
                </a>
                <a href="token_history" class="user-profile-menu-item">
                    <i data-feather="zap"></i> Riwayat Token
                </a>
                <a href="pengaturan" class="user-profile-menu-item">
                    <i data-feather="settings"></i> Pengaturan
                </a>
                <a href="${logoutUrl}" class="user-profile-menu-item user-profile-menu-item--danger" id="btnLogout">
                    <i data-feather="log-out"></i> Logout
                </a>
            </div>
        </div>
    `;

    // Mobile Header HTML (Avatar only, with hidden dropdown) — tetap seperti semula
    const mobileHeaderHTML = `
        <div class="mobile-avatar-container">
            <button type="button" class="user-avatar mobile-header-avatar" id="mobileAvatar" style="background: ${avatarColor}" aria-label="Menu akun ${user.name}" aria-expanded="false">${avatarChar}</button>
            <div class="mobile-logout-dropdown" id="mobileLogoutDropdown">
                <div class="dropdown-user-info">
                    <strong>${user.name}</strong>
                    <span>${user.email}</span>
                </div>
                <a href="profile" class="btn-logout-mobile">
                    <i data-feather="user"></i> Profil Saya
                </a>
                <a href="my_journals" class="btn-logout-mobile">
                    <i data-feather="file-text"></i> Jurnal Saya
                </a>
                <a href="token_history" class="btn-logout-mobile">
                    <i data-feather="zap"></i> Riwayat Token
                </a>
                <a href="pengaturan" class="btn-logout-mobile">
                    <i data-feather="settings"></i> Pengaturan
                </a>
                <a href="#" class="btn-logout-mobile" id="btnMobileLogout">
                    <i data-feather="log-out"></i> Logout
                </a>
            </div>
        </div>
    `;

    return { profileHTML, mobileHeaderHTML };
}

function getCachedNavbarProfile() {
    try {
        const raw = sessionStorage.getItem('cached_navbar_user');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function setCachedNavbarProfile(user) {
    try {
        if (user) {
            sessionStorage.setItem('cached_navbar_user', JSON.stringify(user));
        }
    } catch (e) {}
}

function clearCachedNavbarProfile() {
    try {
        sessionStorage.removeItem('cached_navbar_user');
    } catch (e) {}
}

async function updateNavbarAuth() {
    // Skip auth update if we are on an admin page to avoid leaking user session into admin UI
    if (window.location.pathname.includes('/admin/')) {
        return;
    }

    // Target all auth containers
    const authContainers = [];
    const desktopAuth = document.getElementById('navbarAuth');
    if (desktopAuth) authContainers.push(desktopAuth);

    const mobileAuth = document.querySelectorAll('.nav-auth-section');
    mobileAuth.forEach(el => authContainers.push(el));

    const mobileHeaderAuth = document.getElementById('mobileAuthHeader');

    if (authContainers.length === 0 && !mobileHeaderAuth) return;

    // ===== RENDER INSTAN DARI CACHE (anti-flicker) =====
    // Kalau ada profil tersimpan dari kunjungan sebelumnya, tampilkan
    // langsung TANPA nunggu fetch ke server dulu — ini yang
    // menghilangkan "kedipan kosong" saat pindah halaman. Data ini
    // tetap divalidasi ulang lewat fetch di bawah; kalau ternyata
    // sudah beda/logout, akan otomatis diganti begitu fetch selesai.
    const cachedUser = getCachedNavbarProfile();
    if (cachedUser) {
        const { profileHTML, mobileHeaderHTML } = buildNavbarProfileHTML(cachedUser);
        authContainers.forEach(container => { container.innerHTML = profileHTML; });
        if (mobileHeaderAuth) {
            mobileHeaderAuth.innerHTML = mobileHeaderHTML;
            setupMobileHeaderAuth();
        }
        if (typeof feather !== 'undefined') feather.replace();
    }

    try {
        // Ambil identitas user. Header Authorization SELALU dilampirkan bila ada
        // JWT di localStorage — tidak lagi bergantung pada window.TokenManager
        // (js/api.js) yang hanya dimuat sebagian halaman. Inilah inti perbaikan
        // bug "dashboard login, menu lain guest".
        const fetchMe = async (forceRefresh) => {
            const headers = { 'X-KSM-Context': ksmAuthContext() };
            const token = await ksmGetValidAccessToken(forceRefresh);
            if (token) headers['Authorization'] = `Bearer ${token}`;
            return fetch(`${window.APP_CONFIG.apiBase}/auth_me.php`, {
                credentials: 'include',
                headers,
            });
        };

        let response = await fetchMe(false);

        // 401 dengan refresh token tersedia: access token mungkin sudah mati
        // (mis. dicabut / kedaluwarsa tanpa penanda expiry di localStorage).
        // Rotasi sekali lalu ulangi — sebelumnya kasus ini langsung dianggap
        // "belum login" sehingga navbar jatuh ke Guest padahal sesi masih sah.
        if (response.status === 401 && ksmReadLocal(ksmTokenKeys().refresh)) {
            const rotated = await ksmRefreshAccessToken();
            if (rotated) response = await fetchMe(false);
        }

        const result = await response.json();

        if (result.ok && result.user) {

            // Logged in
            const user = result.user;
            const { profileHTML, mobileHeaderHTML } = buildNavbarProfileHTML(user);

            authContainers.forEach(container => {
                container.innerHTML = profileHTML;
            });

            if (mobileHeaderAuth) {
                mobileHeaderAuth.innerHTML = mobileHeaderHTML;
                setupMobileHeaderAuth();
            }

            // Simpan ke cache untuk kunjungan halaman berikutnya
            setCachedNavbarProfile(user);

            // Sync sessionStorage just in case
            sessionStorage.setItem('userLoggedIn', 'true');
            sessionStorage.setItem('userEmail', user.email);
            sessionStorage.setItem('userName', user.name);
            sessionStorage.setItem('userType', user.role);
        } else {
            // Server memastikan sesi TIDAK sah (bukan gangguan jaringan —
            // itu ditangani di blok catch). Buang token mati agar percobaan
            // refresh berikutnya tidak dianggap "token reuse" oleh server,
            // yang justru mencabut seluruh sesi user.
            clearCachedNavbarProfile();
            const deadKeys = ksmTokenKeys();
            ksmRemoveLocal(deadKeys.access);
            ksmRemoveLocal(deadKeys.refresh);
            ksmRemoveLocal(deadKeys.expiry);


            const loginHTML = `
                <a href="${window.APP_CONFIG.root}/user/login" class="guest-profile" style="text-decoration: none;">
                    <div class="guest-avatar">
                        <i data-feather="user"></i>
                    </div>
                    <span class="guest-label">Guest</span>
                </a>
            `;

            authContainers.forEach(container => {
                container.innerHTML = loginHTML;
            });

            if (mobileHeaderAuth) {
                mobileHeaderAuth.innerHTML = loginHTML;
            }

            sessionStorage.setItem('userLoggedIn', 'false');
        }

        if (typeof feather !== 'undefined') feather.replace();
    } catch (error) {
        console.error('Navbar auth error:', error);
        // Kalau fetch gagal (mis. koneksi putus) TAPI ada cache valid,
        // biarkan hasil render dari cache tadi tetap tampil — jangan
        // ditimpa pesan error, supaya tidak "flicker" balik ke Login.
        if (!cachedUser) {
            authContainers.forEach(container => {
                container.innerHTML = `<a href="${window.APP_CONFIG.root}/user/login" class="btn-login">Login</a>`;
            });
        }
    }
}

// ===== PROFILE DROPDOWN TOGGLE (event delegation, dipasang sekali saja) =====
// Menangani buka/tutup .user-profile-menu tanpa perlu re-bind tiap kali
// updateNavbarAuth() mengganti innerHTML container-nya.
function setupProfileDropdownToggle() {
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.user-profile-trigger');

        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            const profile = trigger.closest('.user-profile');
            if (!profile) return;

            const wasOpen = profile.classList.contains('open');

            // Tutup dropdown profil lain yang mungkin lagi kebuka (mis. kalau
            // ada beberapa authContainer di halaman yang sama)
            document.querySelectorAll('.user-profile.open').forEach((el) => {
                if (el !== profile) el.classList.remove('open');
            });

            profile.classList.toggle('open', !wasOpen);
            return;
        }

        // Klik di luar trigger & menu -> tutup semua dropdown profil yang kebuka
        if (!e.target.closest('.user-profile-menu')) {
            document.querySelectorAll('.user-profile.open').forEach((el) => {
                el.classList.remove('open');
            });
        }
    });

    // Tutup dropdown saat menekan Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.user-profile.open').forEach((el) => {
                el.classList.remove('open');
            });
        }
    });
}

// Function to handle mobile header auth interactions
let mobileHeaderAuthController = null;

function setupMobileHeaderAuth() {
    const avatar = document.getElementById('mobileAvatar');
    const dropdown = document.getElementById('mobileLogoutDropdown');
    const mobileLogoutBtn = document.getElementById('btnMobileLogout');

    if (!avatar || !dropdown) return;

    mobileHeaderAuthController?.abort();
    mobileHeaderAuthController = new AbortController();
    const listenerOptions = { signal: mobileHeaderAuthController.signal };

    avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('active');
        avatar.setAttribute('aria-expanded', String(isOpen));
    }, listenerOptions);

    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            performLogout();
        }, listenerOptions);
    }


    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdown.classList.contains('active')) {
            if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
                avatar.setAttribute('aria-expanded', 'false');
            }
        }
    }, listenerOptions);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
            avatar.setAttribute('aria-expanded', 'false');
            avatar.focus();
        }
    }, listenerOptions);
}

// ===== GLOBAL LOGOUT HANDLER (EVENT DELEGATION) =====
document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('#btnLogout');
    if (!logoutBtn) return;

    e.preventDefault();
    // performLogout() selalu membersihkan token lokal + redirect, termasuk
    // saat request gagal, jadi tombol Logout tidak pernah "diam" lagi.
    performLogout(window.location.origin + window.APP_CONFIG.root + '/user/dashboard');
});


// Initialize navbar auth on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupProfileDropdownToggle();
        updateNavbarAuth();
    });
} else {
    setupProfileDropdownToggle();
    updateNavbarAuth();
}

// Search bar navbar sudah dihapus (lihat navbar.php) — fungsi
// setupNavbarSearch() dan pemanggilannya turut dihapus karena sudah
// tidak ada elemen #navbarSearchInput lagi di DOM manapun.