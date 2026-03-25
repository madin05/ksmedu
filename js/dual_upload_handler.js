// SINGLETON GUARD - prevent multiple initialization
if (window._dualUploadHandlerLoaded) {
  console.warn("dual_upload_handler.js already loaded!");
} else {
  window._dualUploadHandlerLoaded = true;
  // ===== PENGURUS MANAGER CLASS =====
  class PengurusManager {
    constructor(suffix = "") {
      this.suffix = suffix;
      this.pengurusContainer = document.getElementById(
        `pengurusContainer${suffix}`,
      );
      this.addPengurusBtn = document.getElementById(`addPengurusBtnJurnal`);
      this.pengurusCount = 1;

      if (this.pengurusContainer && this.addPengurusBtn) {
        this.init();
      } else {
        console.warn(
          `PengurusManager: Elements not found for suffix "${suffix}"`,
        );
      }
    }

    init() {
      this.addPengurusBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addPengurusField();
      });
    }

    addPengurusField() {
      this.pengurusCount++;
      const pengurusGroup = document.createElement("div");
      pengurusGroup.className = "pengurus-input-group";
      pengurusGroup.dataset.pengurusIndex = this.pengurusCount - 1;
      pengurusGroup.innerHTML = `
            <input type="text" class="pengurus-input" placeholder="Nama Pengurus ${this.pengurusCount}">
            <button type="button" class="btn-remove-pengurus">
                <i data-feather="x"></i>
            </button>
        `;

      this.pengurusContainer.appendChild(pengurusGroup);

      const removeBtn = pengurusGroup.querySelector(".btn-remove-pengurus");
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removePengurusField(pengurusGroup);
      });

      if (typeof feather !== "undefined") feather.replace();
      this.updatePlaceholders();
    }

    removePengurusField(pengurusGroup) {
      const pengurusGroups = this.pengurusContainer.querySelectorAll(
        ".pengurus-input-group",
      );
      if (pengurusGroups.length <= 1) {
        showAlert.warning("Minimal harus ada 1 pengurus!", "Pengurus Minimal");
        return;
      }

      pengurusGroup.remove();
      this.pengurusCount--;
      this.updatePlaceholders();
    }

    updatePlaceholders() {
      const pengurusInputs =
        this.pengurusContainer.querySelectorAll(".pengurus-input");
      pengurusInputs.forEach((input, index) => {
        input.placeholder = `Nama Pengurus ${index + 1}`;
        if (index === 0) input.required = true;
      });

      const removeButtons = this.pengurusContainer.querySelectorAll(
        ".btn-remove-pengurus",
      );
      removeButtons.forEach((btn, index) => {
        btn.style.display = index === 0 ? "none" : "flex";
      });
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

    clearPengurus() {
      const pengurusGroups = this.pengurusContainer.querySelectorAll(
        ".pengurus-input-group",
      );
      pengurusGroups.forEach((group, index) => {
        if (index > 0) group.remove();
      });

      const firstInput =
        this.pengurusContainer.querySelector(".pengurus-input");
      if (firstInput) firstInput.value = "";
      this.pengurusCount = 1;
      this.updatePlaceholders();
    }
  }

  class AuthorsManager {
    constructor(suffix = "") {
      this.suffix = suffix;
      this.authorsContainer = document.getElementById(
        `authorsContainer${suffix}`,
      );
      this.addAuthorBtn = document.getElementById(`addAuthorBtn${suffix}`);
      this.authorCount = 1;

      if (this.authorsContainer && this.addAuthorBtn) {
        this.init();
      }
    }

    init() {
      this.addAuthorBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addAuthorField();
      });
    }

    addAuthorField() {
      this.authorCount++;
      const authorGroup = document.createElement("div");
      authorGroup.className = "author-input-group";
      authorGroup.innerHTML = `
      <input type="text" class="author-input" placeholder="Nama Penulis ${this.authorCount}">
      <button type="button" class="btn-remove-author">
        <i data-feather="x"></i>
      </button>
    `;
      this.authorsContainer.appendChild(authorGroup);

      const removeBtn = authorGroup.querySelector(".btn-remove-author");
      removeBtn.addEventListener("click", () =>
        this.removeAuthorField(authorGroup),
      );

      if (typeof feather !== "undefined") feather.replace();
    }

    removeAuthorField(authorGroup) {
      if (
        this.authorsContainer.querySelectorAll(".author-input-group").length <=
        1
      ) {
        showAlert.warning("Minimal harus ada 1 penulis!", "Penulis Minimal");
        return;
      }
      authorGroup.remove();
      this.authorCount--;
    }

    getAuthors() {
      const inputs = this.authorsContainer.querySelectorAll(".author-input");
      const authors = [];
      inputs.forEach((input) => {
        const value = input.value.trim();
        if (value) authors.push(value);
      });
      return authors;
    }

    clearAuthors() {
      const groups = this.authorsContainer.querySelectorAll(
        ".author-input-group",
      );
      groups.forEach((group, index) => {
        if (index > 0) group.remove();
      });
      const firstInput = this.authorsContainer.querySelector(".author-input");
      if (firstInput) firstInput.value = "";
      this.authorCount = 1;
    }
  }

  // ===== TAGS MANAGER CLASS (tambah ini kalau belum ada) =====
  // ===== TAGS MANAGER CLASS =====
  class TagsManager {
    constructor(suffix = "") {
      this.suffix = suffix;
      this.tagsContainer = document.getElementById(`tagsContainer${suffix}`);
      this.tagsInput = document.getElementById(`tagsInput${suffix}`);
      this.addTagBtn = document.getElementById(`addTagBtn${suffix}`);
      this.tagsList = this.tagsContainer
        ? this.tagsContainer.querySelector(".tags-list")
        : null;
      this.tags = [];

      if (this.tagsContainer && this.tagsInput && this.addTagBtn) {
        this.init();
      }
    }

    init() {
      this.addTagBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addTag();
      });

      this.tagsInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.addTag();
        }
      });
    }

    addTag() {
      const tagValue = this.tagsInput.value.trim().toLowerCase();

      if (!tagValue) {
        showAlert.warning("Tag tidak boleh kosong!", "Tag Kosong");
        return;
      }

      if (tagValue.length < 2) {
        showAlert.warning("Tag minimal 2 karakter!", "Tag Terlalu Pendek");
        return;
      }

      if (this.tags.includes(tagValue)) {
        showAlert.warning("Tag sudah ada!", "Tag Duplikat");
        return;
      }

      if (this.tags.length >= 10) {
        showAlert.warning("Maksimal 10 tag!", "Batas Tag");
        return;
      }

      this.tags.push(tagValue);
      this.tagsInput.value = "";
      this.renderTags();
    }

    renderTags() {
      if (!this.tagsList) return;

      this.tagsList.innerHTML = this.tags
        .map(
          (tag, index) => `
          <span class="tag" data-tag="${tag}">
            ${tag}
            <button type="button" class="btn-remove-tag" data-index="${index}">
              <i data-feather="x"></i>
            </button>
          </span>
        `,
        )
        .join("");

      this.tagsList.querySelectorAll(".btn-remove-tag").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(btn.dataset.index);
          this.removeTag(index);
        });
      });

      if (typeof feather !== "undefined") {
        feather.replace();
      }
    }

    removeTag(index) {
      this.tags.splice(index, 1);
      this.renderTags();
    }

    getTags() {
      return this.tags;
    }

    setTags(tags) {
      this.tags = Array.isArray(tags) ? tags : [];
      this.renderTags();
    }

    clearTags() {
      this.tags = [];
      if (this.tagsInput) this.tagsInput.value = "";
      this.renderTags();
    }
  }

  // ===== DUAL UPLOAD HANDLER - SINGLE DEFINITION ONLY =====

  class DualUploadHandler {
    constructor() {
      // SINGLETON PATTERN
      if (DualUploadHandler._instance) {
        console.warn(
          "DualUploadHandler already exists, returning existing instance",
        );
        return DualUploadHandler._instance;
      }
      DualUploadHandler._instance = this;

      console.log("DualUploadHandler initialized (Database Mode)");

      this.isSubmittingJurnal = false;
      this.isSubmittingOpini = false;

      setTimeout(() => {
        this.initJurnalForm();
        this.initOpiniForm();
      }, 100);
    }

    initJurnalForm() {
      const form = document.getElementById("uploadFormJurnal");
      if (!form) {
        console.error("uploadFormJurnal not found!");
        return;
      }

      console.log("Initializing Jurnal form...");

      try {
        this.jurnalFileManager = new FileUploadManager("Jurnal");
        this.jurnalCoverManager = new CoverUploadManager("Jurnal");
        this.jurnalAuthorsManager = new AuthorsManager("Jurnal");
        this.jurnalPengurusManager = new PengurusManager("Jurnal");
        this.jurnalTagsManager = new TagsManager("Jurnal");

        // Cek apakah sudah pernah di-bind
        if (form.dataset.handlerBound === "true") {
          console.warn("Form sudah ter-bind, skip");
          return;
        }

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          await this.handleJurnalSubmit();
        });

        // Tandai form sudah ter-bind
        form.dataset.handlerBound = "true";

        console.log("Jurnal form ready");
      } catch (error) {
        console.error("Error in initJurnalForm:", error);
      }
    }

    async handleJurnalSubmit() {
      // Cek flag untuk mencegah double submit
      if (this.isSubmittingJurnal) {
        console.warn("Submit sedang diproses, mohon tunggu...");
        return;
      }

      this.isSubmittingJurnal = true;
      this.disableSubmitButton("uploadFormJurnal");

      try {
        // Set flag menjadi true
        this.isSubmittingJurnal = true;

        if (!window.loginManager || !window.loginManager.isAdmin()) {
          showAlert.warning("Login sebagai admin terlebih dahulu!", "Login Diperlukan");
          if (window.loginManager) window.loginManager.openLoginModal();
          this.isSubmittingJurnal = false; // Reset flag
          return;
        }

        if (!this.jurnalFileManager.getUploadedFile()) {
          showAlert.warning("Upload file jurnal terlebih dahulu!", "File Belum Diupload");
          this.isSubmittingJurnal = false; // Reset flag
          return;
        }

        const authors = this.jurnalAuthorsManager.getAuthors();
        if (authors.length === 0) {
          showAlert.warning("Minimal 1 penulis!", "Penulis Diperlukan");
          this.isSubmittingJurnal = false; // Reset flag
          return;
        }

        const pengurus = this.jurnalPengurusManager.getPengurus();
        if (pengurus.length === 0) {
          showAlert.warning("Minimal 1 pengurus!", "Pengurus Diperlukan");
          this.isSubmittingJurnal = false; // Reset flag
          return;
        }

        const judul = document.getElementById("judulJurnal").value.trim();
        const email = document.getElementById("emailJurnal").value.trim();
        const kontak = document.getElementById("kontakJurnal").value.trim();
        const abstrak = document.getElementById("abstrakJurnal").value.trim();
        const volume = document.getElementById("volumeJurnal").value.trim();
        const tags = this.jurnalTagsManager.getTags();

        if (
          !judul ||
          !email ||
          !kontak ||
          !abstrak ||
          !volume ||
          tags.length === 0
        ) {
          if (tags.length === 0) {
            showAlert.warning("Minimal harus ada 1 tag!", "Tag Diperlukan");
          } else {
            showAlert.warning("Semua field harus diisi!", "Field Kosong");
          }
          this.isSubmittingJurnal = false;
          return;
        }

        const phoneRegex = /^(?:(?:\+|00)62|[0])8[1-9]\d{7,11}$/;
        if (!phoneRegex.test(kontak.replace(/\D/g, ""))) {
          showAlert.warning("Nomor kontak harus berupa nomor HP yang valid!\n\nFormat: 08XXXXXXXXX", "Nomor Invalid");
          this.isSubmittingJurnal = false; // Reset flag
          return;
        }

        const file = this.jurnalFileManager.getUploadedFile();
        const confirmMsg = `Judul: ${judul}\nPenulis: ${authors.join(", ")} | Pengurus: ${pengurus.join(", ")}\nKontak: ${kontak} | Ukuran: ${this.formatFileSize(file.size)}`;

        const confirmed = await showAlert.confirm(confirmMsg, "Konfirmasi Upload Jurnal");
        if (!confirmed) {
          console.log("Upload dibatalkan oleh user");
          this.isSubmittingJurnal = false; // Reset flag
          return;
        }

        this.showLoading("Mengupload jurnal ke server...");

        // Upload PDF
        const fileFormData = new FormData();
        fileFormData.append("file", file);

        const fileUploadResponse = await fetch(`${window.APP_CONFIG.apiBase}/upload.php`, {
          method: "POST",
          body: fileFormData,
        });

        const fileResult = await fileUploadResponse.json();

        if (!fileResult.ok) {
          throw new Error(fileResult.message || "Upload file gagal");
        }

        console.log("File uploaded:", fileResult.url);

        // Upload cover
        let coverUrl = null;
        const coverFile = this.jurnalCoverManager.getCoverFile();

        if (coverFile) {
          this.updateLoadingMessage("Mengupload cover image...");

          const coverFormData = new FormData();
          coverFormData.append("file", coverFile);

          const coverUploadResponse = await fetch(`${window.APP_CONFIG.apiBase}/upload.php`, {
            method: "POST",
            body: coverFormData,
          });

          const coverResult = await coverUploadResponse.json();
          if (coverResult.ok) {
            coverUrl = coverResult.url;
            console.log("Cover uploaded:", coverUrl);
          }
        }

        // Create journal
        this.updateLoadingMessage("Menyimpan metadata ke database...");

        const metadata = {
          title: judul,
          abstract: abstrak,
          authors: authors,
          tags: this.jurnalTagsManager.getTags(),
          fileUrl: fileResult.url,
          coverUrl: coverUrl,
          email: email,
          contact: kontak,
          pengurus: pengurus,
          volume: volume, // TAMBAH INI
          client_temp_id: "upload_" + Date.now(),
          client_updated_at: this.toMySQLDateTime(new Date()),
        };

        console.log("Sending metadata:", metadata);

        const createResponse = await fetch(`${window.APP_CONFIG.apiBase}/create_journal.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadata),
        });

        const createResult = await createResponse.json();

        if (!createResult.ok) {
          throw new Error(createResult.message || "Gagal menyimpan metadata");
        }

        console.log("Journal created with ID:", createResult.id);

        this.hideLoading();
        showAlert.success("Jurnal berhasil diupload ke database!", "Upload Berhasil");

        window.dispatchEvent(
          new CustomEvent("journals:changed", {
            detail: { id: createResult.id, action: "created" },
          }),
        );
        this.resetJurnalForm();
      } catch (error) {
        console.error("Upload error:", error);
        this.hideLoading();
        showAlert.error("Gagal upload: " + error.message, "Gagal Upload");
      } finally {
        // Selalu reset flag setelah proses selesai
        this.isSubmittingJurnal = false;
        this.enableSubmitButton("uploadFormJurnal");
      }
    }

    initOpiniForm() {
      const form = document.getElementById("uploadFormOpini");
      if (!form) {
        console.error("uploadFormOpini not found!");
        return;
      }

      console.log("Initializing Opini form...");

      try {
        this.opiniFileManager = new FileUploadManager("Opini");
        this.opiniCoverManager = new CoverUploadManager("Opini");
        this.opiniAuthorsManager = new AuthorsManager("Opini");
        this.opiniTagsManager = new TagsManager("Opini");

        if (form.dataset.handlerBound === "true") {
          console.warn("Form sudah ter-bind, skip");
          return;
        }

        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          await this.handleOpiniSubmit();
        });

        form.dataset.handlerBound = "true";

        console.log("Opini form ready");
      } catch (error) {
        console.error("Error in initOpiniForm:", error);
      }
    }

    async handleOpiniSubmit() {
      if (this.isSubmittingOpini) {
        console.warn("Submit sedang diproses, mohon tunggu...");
        return;
      }

      this.isSubmittingOpini = true;
      this.disableSubmitButton("uploadFormOpini");

      try {
        if (!window.loginManager || !window.loginManager.isAdmin()) {
          showAlert.warning("Login sebagai admin terlebih dahulu!", "Login Diperlukan");
          if (window.loginManager) window.loginManager.openLoginModal();
          return;
        }

        //  FIX: Pakai opiniFileManager (bukan opiniFileHandler)
        const file = this.opiniFileManager.getUploadedFile();
        if (!file) {
          showAlert.warning("Upload file opini terlebih dahulu!", "File Belum Diupload");
          return;
        }

        const authors = this.opiniAuthorsManager.getAuthors();
        if (authors.length === 0) {
          showAlert.warning("Minimal 1 penulis!", "Penulis Diperlukan");
          return;
        }

        const judul = document.getElementById("judulOpini").value.trim();
        const email = document.getElementById("emailOpini").value.trim();
        const kontak = document.getElementById("kontakOpini").value.trim();
        const abstrak = document.getElementById("abstrakOpini").value.trim();
        const tags = this.opiniTagsManager.getTags();

        if (!judul || !email || !kontak || !abstrak || tags.length === 0) {
          if (tags.length === 0) {
            showAlert.warning("Minimal harus ada 1 tag!", "Tag Diperlukan");
          } else {
            showAlert.warning("Semua field harus diisi!", "Field Kosong");
          }
          return;
        }

        const phoneRegex = /^(?:(?:\+|00)62|[0])8[1-9]\d{7,11}$/;
        if (!phoneRegex.test(kontak.replace(/\D/g, ""))) {
          showAlert.warning("Nomor kontak harus berupa nomor HP yang valid!\n\nFormat: 08XXXXXXXXX", "Nomor Invalid");
          return;
        }

        const confirmMsg = `Judul: ${judul}\nPenulis: ${authors.join(", ")}\nKontak: ${kontak} | Ukuran: ${this.formatFileSize(file.size)}`;

        const confirmed = await showAlert.confirm(confirmMsg, "Konfirmasi Upload Opini");
        if (!confirmed) {
          console.log("Upload dibatalkan");
          return;
        }

        this.showLoading("Mengupload opini ke server...");

        // Upload PDF
        const fileFormData = new FormData();
        fileFormData.append("file", file);

        const fileUploadResponse = await fetch(`${window.APP_CONFIG.apiBase}/upload.php`, {
          method: "POST",
          body: fileFormData,
        });

        const fileResult = await fileUploadResponse.json();

        if (!fileResult.ok) {
          throw new Error(fileResult.message || "Upload file gagal");
        }

        console.log(" File uploaded:", fileResult.url);

        // Upload cover -  FIX: Pakai opiniCoverManager
        let coverUrl = null;
        const coverFile = this.opiniCoverManager.getCoverFile();

        if (coverFile) {
          this.updateLoadingMessage("Mengupload cover image...");

          const coverFormData = new FormData();
          coverFormData.append("file", coverFile);

          const coverUploadResponse = await fetch(`${window.APP_CONFIG.apiBase}/upload.php`, {
            method: "POST",
            body: coverFormData,
          });

          const coverResult = await coverUploadResponse.json();
          if (coverResult.ok) {
            coverUrl = coverResult.url;
            console.log(" Cover uploaded:", coverUrl);
          }
        }

        // Create opinion
        this.updateLoadingMessage("Menyimpan metadata ke database...");

        const metadata = {
          title: judul,
          description: abstrak,
          category: "opini",
          author_name: authors.join(", "),
          email: email,
          contact: kontak,
          tags: JSON.stringify(this.opiniTagsManager.getTags()),
          fileUrl: fileResult.url,
          coverUrl: coverUrl,
          client_updated_at: this.toMySQLDateTime(new Date()),
        };

        console.log("Sending opinion metadata:", metadata);

        const createResponse = await fetch(`${window.APP_CONFIG.apiBase}/create_opinion.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadata),
        });

        const createResult = await createResponse.json();

        if (!createResult.ok) {
          throw new Error(createResult.message || "Gagal menyimpan metadata");
        }

        console.log("Opinion created with ID:", createResult.id);

        this.hideLoading();
        showAlert.success("Artikel Opini berhasil diupload!", "Upload Berhasil");

        window.dispatchEvent(
          new CustomEvent("opinions:changed", {
            detail: { id: createResult.id, action: "created" },
          }),
        );
        this.resetOpiniForm();
      } catch (error) {
        console.error("Upload error:", error);
        this.hideLoading();
        showAlert.error("Gagal upload: " + error.message, "Gagal Upload");
      } finally {
        this.isSubmittingOpini = false;
        this.enableSubmitButton("uploadFormOpini");
      }
    }

    // Method lainnya tetap sama...
    toMySQLDateTime(date) {
      const d = date instanceof Date ? date : new Date(date);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    }

    showLoading(message) {
      let overlay = document.getElementById("uploadLoadingOverlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "uploadLoadingOverlay";
        overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      `;
        overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
        justify-content: center; align-items: center; z-index: 9999; color: white;
      `;

        const style = document.createElement("style");
        style.textContent = `
        .loading-spinner {
          width: 60px; height: 60px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
      } else {
        overlay.querySelector(".loading-message").textContent = message;
        overlay.style.display = "flex";
      }
    }

    updateLoadingMessage(message) {
      const overlay = document.getElementById("uploadLoadingOverlay");
      if (overlay) {
        overlay.querySelector(".loading-message").textContent = message;
      }
    }

    hideLoading() {
      const overlay = document.getElementById("uploadLoadingOverlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    }

    resetJurnalForm() {
      document.getElementById("uploadFormJurnal").reset();
      this.jurnalFileManager.removeFile();
      this.jurnalCoverManager.removeCover();
      this.jurnalAuthorsManager.clearAuthors();
      this.jurnalPengurusManager.clearPengurus();
      this.jurnalTagsManager.clearTags();
    }

    resetOpiniForm() {
      document.getElementById("uploadFormOpini").reset();

      if (this.opiniFileManager) {
        this.opiniFileManager.removeFile();
      }
      if (this.opiniCoverManager) {
        this.opiniCoverManager.removeCover();
      }

      this.opiniAuthorsManager.clearAuthors();
      this.opiniTagsManager.clearTags();

      console.log("Opini form reset");
    }

    disableSubmitButton(formId) {
      const submitBtn = document.querySelector(
        `#${formId} button[type="submit"]`,
      );
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = "Sedang memproses...";
      }
    }

    enableSubmitButton(formId) {
      const submitBtn = document.querySelector(
        `#${formId} button[type="submit"]`,
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || "SUBMIT";
      }
    }
  }

  // Initialize on page load
  document.addEventListener("DOMContentLoaded", () => {
    window.dualUploadHandler = new DualUploadHandler();
    console.log("DualUploadHandler ready (Database Mode)");
  });
}

console.log("dual_upload_handler.js loaded");
