const {
  uploadFile,
  getFile,
  checkFileExists,
  deleteFile,
} = require("../../config/storage");
const ApiError = require("../../exceptions/api-error");

class DocumentService {
  #validateDocumentType(type) {
    if (!["contract", "receipt"].includes(type)) {
      throw ApiError.BadRequest("Недопустимый тип документа");
    }
  }

  #generateKey(artistId, type, documentId) {
    return `artists/${artistId}/docs/${type}s/${documentId}.pdf`;
  }

  async #handleStorageOperation(operation, key, ...args) {
    try {
      return await operation(key, ...args);
    } catch (error) {
      throw ApiError.InternalServerError(
        error.message || "Ошибка при работе с файлом"
      );
    }
  }

  async uploadFile(artistId, type, documentId, fileBuffer) {
    this.#validateDocumentType(type);

    const key = this.#generateKey(artistId, type, documentId);

    const exists = await this.#handleStorageOperation(checkFileExists, key);
    if (exists) {
      throw ApiError.ConflictError(`Файл ${documentId}.pdf уже существует.`);
    }

    await this.#handleStorageOperation(
      uploadFile,
      key,
      fileBuffer,
      "application/pdf"
    );
  }

  async downloadFile(artistId, type, documentId) {
    this.#validateDocumentType(type);

    const key = this.#generateKey(artistId, type, documentId);
    return await this.#handleStorageOperation(getFile, key);
  }

  async deleteFile(artistId, type, documentId) {
    this.#validateDocumentType(type);

    const key = this.#generateKey(artistId, type, documentId);
    await this.#handleStorageOperation(deleteFile, key);
  }
}

module.exports = new DocumentService();
