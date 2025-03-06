const {
  uploadFile,
  getFile,
  checkFileExists,
  deleteFile,
} = require("../../config/storage");
const ApiError = require("../../exceptions/api-error");

class DocumentService {
  async uploadFile(artistId, type, documentId, fileBuffer) {
    if (!["contract", "receipt"].includes(type)) {
      throw ApiError.BadRequest("Недопустимый тип документа");
    }

    const key = `artists/${artistId}/docs/${type}s/${documentId}.pdf`;

    try {
      const exists = await checkFileExists(key);
      if (exists) {
        throw ApiError.ConflictError(`Файл ${documentId}.pdf уже существует.`);
      }

      await uploadFile(key, fileBuffer, "application/pdf");
    } catch (error) {
      throw ApiError.InternalServerError(error);
    }
  }

  async downloadFile(artistId, type, documentId) {
    if (!["contract", "receipt"].includes(type)) {
      throw ApiError.BadRequest("Недопустимый тип документа");
    }

    const key = `artists/${artistId}/docs/${type}s/${documentId}.pdf`;

    try {
      const fileBuffer = await getFile(key);
      return fileBuffer;
    } catch (error) {
      throw ApiError.InternalServerError(error);
    }
  }

  async deleteFile(artistId, type, documentId) {
    if (!["contract", "receipt"].includes(type)) {
      throw ApiError.BadRequest("Недопустимый тип документа");
    }

    const key = `artists/${artistId}/docs/${type}s/${documentId}.pdf`;

    try {
      const exists = await checkFileExists(key);
      if (!exists) {
        throw ApiError.NotFoundError(`Файл ${documentId}.pdf не найден.`);
      }

      await deleteFile(key);
    } catch (error) {
      throw ApiError.InternalServerError(error);
    }
  }
}

module.exports = new DocumentService();
