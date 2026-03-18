// opinions_manager.js - Database-focused Opinion Manager
class OpinionManager {
  constructor() {
    this.apiBase = "/ksmaja/api";
    console.log("OpinionManager initialized (Database Mode)");
  }

  async uploadOpinionToDatabase(opinionData) {
    try {
      console.log("Uploading opinion to database...");

      const formData = new FormData();

      formData.append("title", opinionData.judulJurnal);
      formData.append("description", opinionData.abstrak);
      formData.append("category", "opini");
      formData.append("author_name", opinionData.namaPenulis.join(", "));
      formData.append("email", opinionData.email);
      formData.append("contact", opinionData.kontak);

      if (opinionData.tags && opinionData.tags.length > 0) {
        formData.append("tags", JSON.stringify(opinionData.tags));
      }

      if (opinionData.fileData) {
        if (opinionData.fileData instanceof File) {
          formData.append("file_pdf", opinionData.fileData);
        } else if (opinionData.fileData instanceof Blob) {
          formData.append(
            "file_pdf",
            opinionData.fileData,
            opinionData.fileName || "opinion.pdf"
          );
        }
      }

      if (opinionData.coverImage) {
        if (opinionData.coverImage instanceof File) {
          formData.append("cover_image", opinionData.coverImage);
        } else if (
          typeof opinionData.coverImage === "string" &&
          opinionData.coverImage.startsWith("data:")
        ) {
          const blob = this.base64ToBlob(opinionData.coverImage);
          formData.append("cover_image", blob, "cover.jpg");
        }
      }

      const response = await fetch(`${this.apiBase}/create_opinion.php`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        console.log("Opinion uploaded successfully, ID:", result.id);

        window.dispatchEvent(
          new CustomEvent("opinions:changed", {
            detail: {
              action: "uploaded",
              id: result.id,
            },
          })
        );

        return result;
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  base64ToBlob(base64) {
    const parts = base64.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
  }

  async addOpinion(opinionData) {
    console.log("Adding opinion:", opinionData.judulJurnal);

    try {
      const dbResult = await this.uploadOpinionToDatabase(opinionData);
      console.log("Opinion saved to database with ID:", dbResult.id);
      return dbResult;
    } catch (error) {
      console.error("Database upload failed:", error);
      throw error;
    }
  }

  async deleteOpinion(id) {
    try {
      const response = await fetch(
        `${this.apiBase}/delete_opinion.php?id=${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.ok) {
        console.log("Opinion deleted:", id);

        window.dispatchEvent(
          new CustomEvent("opinions:changed", {
            detail: {
              action: "deleted",
              id: id,
            },
          })
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  }

  async getOpinionById(id) {
    try {
      const response = await fetch(`${this.apiBase}/get_opinion.php?id=${id}`);
      const result = await response.json();

      if (result.ok && result.result) {
        return result.result;
      }
      return null;
    } catch (error) {
      console.error("Get opinion error:", error);
      return null;
    }
  }

  async updateOpinion(id, updatedData) {
    try {
      const formData = new FormData();
      formData.append("id", id);

      for (const key in updatedData) {
        if (updatedData[key] instanceof File) {
          formData.append(key, updatedData[key]);
        } else if (typeof updatedData[key] === "object") {
          formData.append(key, JSON.stringify(updatedData[key]));
        } else {
          formData.append(key, updatedData[key]);
        }
      }

      const response = await fetch(`${this.apiBase}/update_opinion.php`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.ok) {
        console.log("Opinion updated:", id);

        window.dispatchEvent(
          new CustomEvent("opinions:changed", {
            detail: {
              action: "updated",
              id: id,
            },
          })
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error("Update error:", error);
      return false;
    }
  }

  getCurrentDate() {
    const days = [
      "MINGGU",
      "SENIN",
      "SELASA",
      "RABU",
      "KAMIS",
      "JUMAT",
      "SABTU",
    ];
    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    const now = new Date();
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    return dayName + " - " + day + " " + month + " " + year;
  }
}

console.log("opinions_manager.js loaded (Database Mode)");
