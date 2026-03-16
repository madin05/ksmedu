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
      alert("Tag tidak boleh kosong!");
      return;
    }

    if (tagValue.length < 2) {
      alert("Tag minimal 2 karakter!");
      return;
    }

    if (this.tags.includes(tagValue)) {
      alert("Tag sudah ada!");
      return;
    }

    if (this.tags.length >= 10) {
      alert("Maksimal 10 tag!");
      return;
    }

    this.tags.push(tagValue);
    this.tagsInput.value = "";
    this.renderTags();
  }

  renderTags() {
    this.tagsList.innerHTML = this.tags
      .map(
        (tag, index) => `
        <span class="tag-item" data-tag="${tag}">
          ${tag}
          <button type="button" class="btn-remove-tag" data-index="${index}">
            <i data-feather="x"></i>
          </button>
        </span>
      `
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
    this.tagsInput.value = "";
    this.renderTags();
  }
}
