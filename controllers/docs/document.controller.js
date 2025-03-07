const DocumentService = require("../../services/docs/document.service");
const { HTTP_STATUS } = require("../../config/http-statuses");
const ApiError = require("../../exceptions/api-error");

class DocumentController {
  #extractParams(req) {
    const { id: artistId, type, documentId } = req.params;
    return { artistId, type, documentId };
  }

  async uploadDocument(req, res, next) {
    try {
      const { artistId, type, documentId } = this.#extractParams(req);

      if (!req.file || !req.file.buffer) {
        throw new ApiError.BadRequest("Файл не был загружен");
      }

      const fileBuffer = req.file.buffer;

      await DocumentService.uploadFile(artistId, type, documentId, fileBuffer);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Документ успешно загружен.",
      });
    } catch (e) {
      next(e);
    }
  }

  async downloadDocument(req, res, next) {
    try {
      const { artistId, type, documentId } = this.#extractParams(req);

      const fileStream = await DocumentService.downloadFileStream(
        artistId,
        type,
        documentId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${documentId}.pdf"`
      );
      fileStream.pipe(res);
    } catch (e) {
      next(e);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { artistId, type, documentId } = this.#extractParams(req);

      await DocumentService.deleteFile(artistId, type, documentId);

      return res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new DocumentController();
