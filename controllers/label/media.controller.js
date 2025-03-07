const mediaService = require("../../services/label/media.service");
const { HTTP_STATUS } = require("../../config/http-statuses");

class MediaController {
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

  async uploadTrack(req, res, next) {
    try {
      const artistId = req.params.id;
      const { releaseId } = req.params;
      const { trackNumber, trackTitle, fileType } = req.body;
      const fileBufferOrStream = req.file.buffer;

      if (
        !trackNumber ||
        typeof trackNumber !== "number" ||
        !trackTitle ||
        typeof trackTitle !== "string" ||
        !fileType ||
        !["wav", "flac"].includes(fileType)
      ) {
        throw new ApiError.BadRequest("Неверные параметры трека");
      }

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
