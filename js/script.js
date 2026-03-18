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
    info: "info"
  };
  
  const icon = iconMap[type] || "info";
  const toastTitle = title || (type === "error" ? "Pesan Kesalahan" : "Informasi");

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
    toast.addEventListener("transitionend", () => {
      toast.remove();
    }, { once: true });
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
      showToast("Silakan masukkan tag terlebih dahulu.", "warning", "INPUT KOSONG");
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
        `/ksmaja/api/get_journal.php?id=${journalId}`,
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
      showToast("Gagal memuat data jurnal: " + error.message, "error", "ERROR DATABASE");
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
      showToast("Minimal harus ada satu penulis untuk artikel.", "warning", "VALIDASI GAGAL");
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
      showToast("Minimal harus ada satu penulis untuk artikel.", "warning", "VALIDASI GAGAL");
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
      const formData = new FormData();

      formData.append("id", this.currentJournalId);

      if (judul) formData.append("title", judul);
      if (abstrak) formData.append("abstract", abstrak);
      if (email) formData.append("email", email);
      if (contact) formData.append("contact", contact);
      if (volume) formData.append("volume", volume);

      if (authors.length > 0)
        formData.append("authors", JSON.stringify(authors));
      if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
      if (pengurus.length > 0)
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

      const response = await fetch("/ksmaja/api/update_journal.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      this.hideLoading();

      showToast("Perubahan jurnal telah disimpan ke sistem.", "success", "UPDATE BERHASIL");
      this.closeEditModal();

      // Dispatch event to refresh lists without reload
      const eventName = this.currentType === "jurnal" ? "journals:changed" : "opinions:changed";
      window.dispatchEvent(new CustomEvent(eventName, { 
        detail: { id: this.currentJournalId, action: "updated" } 
      }));

      if (window.statisticManager) {
        window.statisticManager.fetchStatistics();
      }
    } catch (error) {
      console.error("Edit journal error:", error);
      this.hideLoading();
      showToast("Gagal memperbarui data: " + error.message, "error", "UPDATE GAGAL");
    }
  }

  showLoading(message) {
    let overlay = document.getElementById("editLoadingOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "editLoadingOverlay";
      overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      `;
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 10000; color: white;
      `;
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

  if (
    window.journalManager &&
    typeof window.journalManager.renderJournals === "function"
  ) {
    window.journalManager.renderJournals();
  }

  if (
    window.paginationManager &&
    typeof window.paginationManager.render === "function"
  ) {
    window.paginationManager.render();
  }
}

// ===== GLOBAL DELETE OPINION =====
window.deleteOpinion = async function (id, title) {
  if (!confirm(`Yakin ingin menghapus opini "${title}"?`)) return;

  const card = document.querySelector(`[data-opinion-id="${id}"]`);
  if (card) {
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
  }

  try {
    const response = await fetch(`/ksmaja/api/delete_opinion.php?id=${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (result.ok) {
      showToast("Artikel opini telah dihapus selamanya.", "success", "HAPUS BERHASIL");
      window.dispatchEvent(new CustomEvent("opinions:changed", { 
        detail: { id: id, action: "deleted" } 
      }));
    } else {
      throw new Error(result.message || "Gagal menghapus");
    }
  } catch (error) {
      showToast("Gagal menghapus artikel: " + error.message, "error", "HAPUS GAGAL");
    if (card) {
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
    }
  }
};

// ===== GLOBAL EDIT OPINION =====
window.openEditOpinionModal = async function (id) {
  try {
    const response = await fetch(`/ksmaja/api/get_opinion.php?id=${id}`);
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
      showToast("Gagal memuat data artikel: " + error.message, "error", "ERROR LOAD");
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

  // Page: journals.html
  if (window.location.pathname.includes("journals.html")) {
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

  // Page: opinions.html (ADMIN MODE)
  if (window.location.pathname.includes("opinions.html")) {
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
          if (authors.length > 0) formData.append("authors", JSON.stringify(authors));
          
          const tags = window.editJournalManager.getTags();
          if (tags.length === 0) {
            showToast("Minimal harus ada satu tag.", "warning", "VALIDASI GAGAL");
            return;
          }
          formData.append("tags", JSON.stringify(tags));
        }

        try {
          const response = await fetch("/ksmaja/api/update_opinion.php", {
            method: "POST",
            body: formData,
          });
          const result = await response.json();
          if (result.ok) {
            showToast("Artikel opini berhasil diperbarui.", "success", "UPDATE BERHASIL");
            document.getElementById("editModal").classList.remove("active");
            document.body.style.overflow = "auto";
            
            // Dispatch event to refresh lists without reload
            window.dispatchEvent(new CustomEvent("opinions:changed", { 
              detail: { id: id, action: "updated" } 
            }));

            if (window.statisticManager) {
              window.statisticManager.fetchStatistics();
            }
          } else {
            throw new Error(result.message);
          }
        } catch (err) {
          showToast("Gagal update opini: " + err.message, "error", "UPDATE GAGAL");
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

  // Page: opinions_user.html (USER MODE)
  if (
    window.location.pathname.includes("opinions_user.html") ||
    document.getElementById("opinionsContainer")
  ) {
    console.log("Opinions page (USER MODE) detected");
    return;
  }

  // Page: dashboard_admin.html & index.html
  if (typeof StatisticsManager !== "undefined")
    window.statsManager = new StatisticsManager();

  if (typeof SearchManager !== "undefined")
    window.searchManager = new SearchManager();

  if (typeof EditJournalManager !== "undefined")
    window.editJournalManager = new EditJournalManager();

  window.previewViewer = new PreviewViewer();

  if (window.loginManager) {
    window.loginManager.syncLoginStatus();
  }

  try {
    if (
      window.statsManager &&
      typeof window.statsManager.updateArticleCount === "function"
    ) {
      setTimeout(() => {
        try {
          window.statsManager.updateArticleCount();
          if (typeof window.statsManager.startCounterAnimation === "function") {
            window.statsManager.startCounterAnimation();
          }
        } catch (e) {
          console.warn("Stats manager error (safe to ignore):", e);
        }
      }, 100);
    }
  } catch (e) {
    console.warn("Stats manager not available");
  }

  syncLoginStatusUI();

  console.log(" All systems initialized successfully");
});

console.log("script.js loaded");
