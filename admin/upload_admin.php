<?php
$page_title = 'Upload Artikel - KSM Education';
include 'components/header.php';
include 'components/sidebar.php';
?>

    <!-- Main Content Container -->
    <div class="container">
      <!-- Upload Section -->
      <section id="upload" class="upload-section" style="margin-top: 24px; margin-bottom: 48px;">
        <!-- Tab Navigation -->
        <div class="upload-tabs">
          <button class="upload-tab active" data-tab="jurnal">
            <i data-feather="book-open"></i>
            Upload Artikel Jurnal
          </button>
          <button class="upload-tab" data-tab="opini">
            <i data-feather="edit-3"></i>
            Upload Artikel Opini
          </button>
        </div>

        <div
          id="jurnalTab"
          class="upload-tab-content active"
          style="display: block"
        >
          <h2>Upload Artikel Jurnal</h2>

          <div class="document-upload-section">
            <h3>Upload File Jurnal (PDF)</h3>
            <div id="dropZoneJurnal" class="drop-zone">
              <div class="upload-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
                  />
                </svg>
              </div>
              <p class="upload-text">
                Drag and Drop atau
                <span class="browse-link">klik untuk upload</span>
              </p>
              <p class="upload-subtext">Format: PDF(Max 10MB)</p>
              <input type="file" id="fileInputJurnal" accept=".pdf" hidden />
            </div>

            <div class="cover-upload-section">
              <h3>Upload Cover Jurnal</h3>
              <div id="coverDropZoneJurnal" class="cover-drop-zone">
                <div class="upload-icon">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                    />
                  </svg>
                </div>
                <p class="upload-text">
                  Drag and Drop atau
                  <span class="browse-link">klik untuk upload</span>
                </p>
                <p class="upload-subtext">Format: JPG, PNG (Max 2MB)</p>
                <input
                  type="file"
                  id="coverInputJurnal"
                  accept="image/*"
                  hidden
                />
              </div>
              <div
                id="coverPreviewJurnal"
                class="cover-preview"
                style="display: none"
              >
                <img id="coverImageJurnal" src="" alt="Cover Preview" />
                <button
                  type="button"
                  class="remove-cover-btn"
                  id="removeCoverJurnal"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              id="filePreviewJurnal"
              class="file-preview"
              style="display: none"
            >
              <div class="file-info">
                <svg class="file-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
                  />
                </svg>
                <div class="file-details">
                  <div class="file-name" id="fileNameJurnal"></div>
                  <div class="file-size" id="fileSizeJurnal"></div>
                </div>
                <button
                  type="button"
                  class="remove-file-btn"
                  id="removeFileJurnal"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <form id="uploadFormJurnal">
            <div class="form-group">
              <label for="judulJurnal">Judul Jurnal<span>*</span></label>
              <input
                type="text"
                id="judulJurnal"
                placeholder="Masukkan Judul Jurnal"
                style="text-transform: capitalize"
                required
              />
            </div>

            <div class="form-group">
              <label>Tag/Keyword<span>*</span></label>
              <div id="tagsContainerJurnal" class="tags-input-group">
                <div class="tags-list tags-container"></div>
                <div style="display: flex; gap: 8px">
                  <input
                    type="text"
                    id="tagsInputJurnal"
                    placeholder="Masukkan tag (Enter untuk tambah)"
                    maxlength="20"
                  />
                  <button
                    type="button"
                    id="addTagBtnJurnal"
                    class="btn-secondary"
                  >
                    Tambah Tag
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Pengurus</label>
              <div id="pengurusContainerJurnal">
                <div class="pengurus-input-group">
                  <input
                    type="text"
                    class="pengurus-input"
                    placeholder="Nama Pengurus 1"
                    required
                  />
                  <button
                    type="button"
                    class="btn-remove-pengurus"
                    style="display: none"
                  >
                    <i data-feather="x"></i>
                  </button>
                </div>
              </div>
              <button
                type="button"
                id="addPengurusBtnJurnal"
                class="btn-secondary"
              >
                <i data-feather="plus"></i> Tambah Pengurus
              </button>
            </div>

            <div class="form-group">
              <label>Nama Penulis<span>*</span></label>
              <div id="authorsContainerJurnal">
                <div class="author-input-group" data-author-index="0">
                  <input
                    type="text"
                    class="author-input"
                    placeholder="Nama Penulis 1"
                    required
                  />
                  <button
                    type="button"
                    class="btn-remove-author"
                    style="display: none"
                  >
                    <i data-feather="x"></i>
                  </button>
                </div>
              </div>
              <button
                type="button"
                id="addAuthorBtnJurnal"
                class="btn-add-author"
              >
                <i data-feather="plus"></i> Tambah Penulis
              </button>
            </div>

            <div class="form-group">
              <label for="emailJurnal">Email<span>*</span></label>
              <input type="email" id="emailJurnal" placeholder="email@contoh.com" required />
            </div>

            <div class="form-group">
              <label for="kontakJurnal">Kontak Penulis<span>*</span></label>
              <input
                type="tel"
                id="kontakJurnal"
                placeholder="08XXXXXXXXX"
                pattern="[0-9+\-\s]{10,}"
                required
              />
            </div>

            <div class="form-group">
              <label for="volumeJurnal">Volume<span>*</span></label>
              <input
                type="text"
                id="volumeJurnal"
                placeholder="Contoh: Vol. 12 No. 3 (2025)"
                required
              />
              <small
                style="
                  color: #666;
                  font-size: 12px;
                  margin-top: 4px;
                  display: block;
                "
                >Format: Vol. X No. Y (Tahun)</small
              >
            </div>

            <div class="form-group">
              <label for="abstrakJurnal">Abstrak<span>*</span></label>
              <textarea
                id="abstrakJurnal"
                placeholder="Masukkan Abstrak Jurnal"
                rows="4"
                required
              ></textarea>
            </div>

            <button type="submit" class="btn-submit">Submit Jurnal</button>
          </form>
        </div>

        <div id="opiniTab" class="upload-tab-content" style="display: none">
          <h2>Upload Artikel Opini</h2>

          <div class="document-upload-section">
            <h3>Upload File Opini (PDF)</h3>
            <div id="dropZoneOpini" class="drop-zone">
              <div class="upload-icon">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
                  />
                </svg>
              </div>
              <p class="upload-text">
                Drag and Drop atau
                <span class="browse-link">klik untuk upload</span>
              </p>
              <p class="upload-subtext">Format: PDF(Max 10MB)</p>
              <input type="file" id="fileInputOpini" accept=".pdf" hidden />
            </div>

            <div class="cover-upload-section">
              <h3>Upload Cover Opini</h3>
              <div id="coverDropZoneOpini" class="cover-drop-zone">
                <div class="upload-icon">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                    />
                  </svg>
                </div>
                <p class="upload-text">
                  Drag and Drop atau
                  <span class="browse-link">klik untuk upload</span>
                </p>
                <p class="upload-subtext">Format: JPG, PNG (Max 2MB)</p>
                <input
                  type="file"
                  id="coverInputOpini"
                  accept="image/*"
                  hidden
                />
              </div>
              <div
                id="coverPreviewOpini"
                class="cover-preview"
                style="display: none"
              >
                <img id="coverImageOpini" src="" alt="Cover Preview" />
                <button
                  type="button"
                  class="remove-cover-btn"
                  id="removeCoverOpini"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              id="filePreviewOpini"
              class="file-preview"
              style="display: none"
            >
              <div class="file-info">
                <svg class="file-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
                  />
                </svg>
                <div class="file-details">
                  <div class="file-name" id="fileNameOpini"></div>
                  <div class="file-size" id="fileSizeOpini"></div>
                </div>
                <button
                  type="button"
                  class="remove-file-btn"
                  id="removeFileOpini"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <form id="uploadFormOpini">
            <div class="form-group">
              <label for="judulOpini">Judul Opini<span>*</span></label>
              <input
                type="text"
                id="judulOpini"
                placeholder="Masukkan Judul Opini"
                style="text-transform: capitalize"
                required
              />
            </div>

            <div class="form-group">
              <label>Tag/Keyword<span>*</span></label>
              <div id="tagsContainerOpini" class="tags-input-group">
                <div class="tags-list tags-container"></div>
                <div style="display: flex; gap: 8px">
                  <input
                    type="text"
                    id="tagsInputOpini"
                    placeholder="Masukkan tag (Enter untuk tambah)"
                    maxlength="20"
                  />
                  <button
                    type="button"
                    id="addTagBtnOpini"
                    class="btn-secondary"
                  >
                    Tambah Tag
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Nama Penulis<span>*</span></label>
              <div id="authorsContainerOpini">
                <div class="author-input-group" data-author-index="0">
                  <input
                    type="text"
                    class="author-input"
                    placeholder="Nama Penulis 1"
                    required
                  />
                  <button
                    type="button"
                    class="btn-remove-author"
                    style="display: none"
                  >
                    <i data-feather="x"></i>
                  </button>
                </div>
              </div>
              <button
                type="button"
                id="addAuthorBtnOpini"
                class="btn-add-author"
              >
                <i data-feather="plus"></i> Tambah Penulis
              </button>
            </div>

            <div class="form-group">
              <label for="emailOpini">Email<span>*</span></label>
              <input type="email" id="emailOpini" placeholder="email@contoh.com" required />
            </div>

            <div class="form-group">
              <label for="kontakOpini">Kontak Penulis<span>*</span></label>
              <input
                type="tel"
                id="kontakOpini"
                placeholder="08XXXXXXXXX"
                pattern="[0-9+\-\s]{10,}"
                required
              />
            </div>

            <div class="form-group">
              <label for="abstrakOpini">Deskripsi<span>*</span></label>
              <textarea
                id="abstrakOpini"
                placeholder="Masukkan Deskripsi Opini"
                rows="4"
                required
              ></textarea>
            </div>

            <button type="submit" class="btn-submit">Submit Opini</button>
          </form>
        </div>
      </section>
    </div>

<?php
$extra_scripts = <<<'EOT'
<script src="../js/statistic.js"></script>
    <script src="../js/tags_manager.js?v=20240316"></script>
    <script src="../js/file_upload.js"></script>
    <script src="../js/dual_upload_handler.js"></script>
    <script src="../js/upload_tabs.js"></script>
    <script src="../js/social.js"></script>
    <script>
      if (typeof feather !== 'undefined') feather.replace();
    </script>
EOT;
include 'components/footer.php';
?>
