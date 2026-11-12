// ===== SHARE MODAL & DOWNLOAD UTILITIES =====
let currentShareUrl = "";
let currentShareTitle = "";

function downloadJournalPdf(fileUrl, title) {
  if (!fileUrl || fileUrl === "undefined" || fileUrl === "null" || fileUrl === "") {
    if (typeof showAlert !== "undefined") {
      showAlert.warning("File PDF tidak tersedia untuk artikel ini.", "PDF Tidak Ditemukan");
    } else {
      alert("File PDF tidak tersedia untuk artikel ini.");
    }
    return;
  }
  
  let finalUrl = fileUrl;
  if (!fileUrl.startsWith("http") && !fileUrl.startsWith("data:") && !fileUrl.startsWith("/") && !fileUrl.startsWith("../")) {
    finalUrl = "../" + fileUrl;
  }

  const link = document.createElement("a");
  link.href = finalUrl;
  link.download = (title || "Artikel") + ".pdf";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (typeof showToast === "function") {
    showToast("Memulai unduhan PDF...", "info");
  }
}

function openShareModal(id, explicitType) {
  let article = null;

  if (window.journalManager && typeof window.journalManager.getJournalById === "function") {
    article = window.journalManager.getJournalById(id);
  }
  if (!article && window.paginationManager && typeof window.paginationManager.getItemById === "function") {
    article = window.paginationManager.getItemById(id);
  }
  if (!article && window.opinionsManager && typeof window.opinionsManager.getOpinionById === "function") {
    article = window.opinionsManager.getOpinionById(id);
  }

  if (!article) {
    const card = document.querySelector(`[data-jurnal-id="${id}"], [data-journal-id="${id}"], [data-opini-id="${id}"], [data-opinion-id="${id}"]`);
    if (card) {
      const titleEl = card.querySelector('.journal-title, .opinion-title, h3');
      article = {
        id: id,
        title: titleEl ? titleEl.innerText.trim() : "Artikel KSM Education"
      };
    }
  }

  if (!article) {
    article = { id: id, title: "Artikel KSM Education" };
  }

  const baseUrl = window.location.origin;
  const path = window.location.pathname.substring(
    0,
    window.location.pathname.lastIndexOf("/")
  );

  const isOpiniPage = window.location.pathname.includes("opini");
  const articleType =
    explicitType || article._type || article.type || (isOpiniPage ? "opini" : "jurnal");
  const explorePage = articleType === "opini" ? "explore_opini" : "explore_jurnal";

  currentShareUrl = `${baseUrl}${path}/${explorePage}?id=${id}&type=${articleType}`;
  currentShareTitle = article.title || "Artikel KSM Education";

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
        showAlert.success("Link berhasil disalin!", "Sukses");
      }
    })
    .catch(() => {
      showAlert.error("Gagal menyalin link, salin manual:\n\n" + currentShareUrl, "Gagal Menyalin");
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
      currentShareUrl,
    )}`,
    "_blank",
  );
}

function shareToTwitter() {
  if (!currentShareUrl) return;
  const text = encodeURIComponent(currentShareTitle);
  window.open(
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      currentShareUrl,
    )}&text=${text}`,
    "_blank",
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

window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.downloadJournalPdf = downloadJournalPdf;
window.copyShareLink = copyShareLink;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToFacebook = shareToFacebook;
window.shareToTwitter = shareToTwitter;
