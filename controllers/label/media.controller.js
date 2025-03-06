const mediaService = require("../../services/label/media.service");
const { HTTP_STATUS } = require("../../config/http-statuses");

class MediaController {
  /**
   * Загрузка обложки релиза
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async uploadCover(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId } = req.params;
      const fileBuffer = req.file.buffer;

      await mediaService.uploadCover(artistId, releaseId, fileBuffer);

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Обложка успешно загружена.",
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Загрузка трека релиза
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async uploadTrack(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId } = req.params;
      const { trackNumber, trackTitle, fileType } = req.body;
      const fileBufferOrStream = req.file.buffer;

      await mediaService.uploadTrack(
        artistId,
        releaseId,
        trackNumber,
        trackTitle,
        fileBufferOrStream,
        fileType
      );

      return res.status(HTTP_STATUS.CREATED).json({
        message: "Трек успешно загружен.",
      });
    } catch (e) {
      next(e);
    }
  }

  /**
   * Получение обложки релиза
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getCover(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId, size } = req.params;

      const coverStream = await mediaService.getCover(
        artistId,
        releaseId,
        size
      );

      res.setHeader("Content-Type", "image/jpeg");
      coverStream.pipe(res);
    } catch (e) {
      next(e);
    }
  }

  /**
   * Получение трека релиза
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getTrack(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId, fileName } = req.params;

      const trackStream = await mediaService.getTrack(
        artistId,
        releaseId,
        fileName
      );

      const contentType =
        path.extname(fileName).toLowerCase() === ".flac"
          ? "audio/flac"
          : "audio/wav";

      res.setHeader("Content-Type", contentType);
      trackStream.pipe(res);
    } catch (e) {
      next(e);
    }
  }

  /**
   * Скачивание файла (обложка или трек)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async downloadFile(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId, fileName } = req.params;

      let filePath = "/";

      if (fileName === "cover") {
        filePath = "/cover.jpg";
      } else {
        filePath = `/tracks/${fileName}`;
      }

      const fileBuffer = await mediaService.downloadFile(
        artistId,
        releaseId,
        filePath
      );

      const contentType =
        path.extname(fileName).toLowerCase() === ".flac"
          ? "audio/flac"
          : path.extname(fileName).toLowerCase() === ".wav"
          ? "audio/wav"
          : "application/octet-stream";

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Type", contentType);
      res.send(fileBuffer);
    } catch (e) {
      next(e);
    }
  }

  /**
   * Удаление файла (обложка или трек)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async deleteFile(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId, fileName } = req.params;

      await mediaService.deleteFile(artistId, releaseId, fileName);

      return res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new MediaController();
