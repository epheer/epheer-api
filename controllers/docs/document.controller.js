const DocumentService = require("../../services/docs/document.service");
const { HTTP_STATUS } = require("../../config/http-statuses");

class DocumentController {
  async uploadDocument(req, res, next) {
    try {
      const artistId = req.params.id;
      const type = req.params.type;
      const documentId = req.params.documentId;
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
      const artistId = req.params.id;
      const type = req.params.type;
      const documentId = req.params.documentId;

      const fileBuffer = await DocumentService.downloadFile(
        artistId,
        type,
        documentId
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${documentId}.pdf"`
      );
      res.send(fileBuffer);
    } catch (e) {
      next(e);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const artistId = req.params.id;
      const type = req.params.type;
      const documentId = req.params.documentId;

      await DocumentService.deleteFile(artistId, type, documentId);

      return res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new DocumentController();
