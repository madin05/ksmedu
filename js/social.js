// ===== SHARE MODAL =====
let currentShareUrl = "";
let currentShareTitle = "";

function openShareModal(id) {
  const article =
    (window.journalManager && window.journalManager.getJournalById(id)) ||
    (window.paginationManager && typeof window.paginationManager.getItemById === "function"
      ? window.paginationManager.getItemById(id)
      : null);

  if (!article) {
    alert("Data artikel tidak ditemukan.");
    return;
  }

  const baseUrl = window.location.origin;
  const path = window.location.pathname.substring(
    0,
    window.location.pathname.lastIndexOf("/")
  );

  // Detect type from page URL or article data
  const isOpiniPage = window.location.pathname.includes("opini");
  const articleType = article._type || article.type || (isOpiniPage ? "opini" : "jurnal");
  const explorePage = "explore_jurnal_user.html";

  currentShareUrl = `${baseUrl}${path}/${explorePage}?id=${id}&type=${articleType}`;
  currentShareTitle = article.title || "Artikel";

  const input = document.getElementById("shareUrlInput");
  const modal = document.getElementById("shareModal");
  if (!input || !modal) return;

  input.value = currentShareUrl;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  if (typeof feather !== "undefined") feather.replace();
}

function closeShareModal() {
  const modal = document.getElementById("shareModal");
  if (!modal) return;
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

function copyShareLink() {
  if (!currentShareUrl) return;
  navigator.clipboard
    .writeText(currentShareUrl)
    .then(() => {
      if (typeof showToast === "function") {
        showToast("Link berhasil disalin!", "success");
      } else {
        alert("Link berhasil disalin!\n\n" + currentShareUrl);
      }
    })
    .catch(() => {
      alert("Gagal menyalin link, salin manual:\n\n" + currentShareUrl);
    });
}

function shareToWhatsApp() {
  if (!currentShareUrl) return;
  const text = encodeURIComponent(`${currentShareTitle}\n\n${currentShareUrl}`);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

function shareToFacebook() {
  if (!currentShareUrl) return;
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      currentShareUrl
    )}`,
    "_blank"
  );
}

function shareToTwitter() {
  if (!currentShareUrl) return;
  const text = encodeURIComponent(currentShareTitle);
  window.open(
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      currentShareUrl
    )}&text=${text}`,
    "_blank"
  );
}

// Tutup modal share kalau klik overlay
document.addEventListener("DOMContentLoaded", () => {
  const shareModal = document.getElementById("shareModal");
  if (!shareModal) return;

  const overlay = shareModal.querySelector(".modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", () => {
      closeShareModal();
    });
  }
});
