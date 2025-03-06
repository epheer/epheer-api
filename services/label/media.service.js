const {
  uploadFile,
  getFileAsStream,
  deleteFile,
  checkFileExists,
} = require("../../config/storage");
const sharp = require("sharp");
const ApiError = require("../../exceptions/api-error");
const {
  validateAudioFile,
  validateImageFile,
} = require("../../validators/media.validator");

class MediaService {
  async uploadCover(artistId, releaseId, fileBuffer) {
    if (!(await validateImageFile(fileBuffer))) {
      throw new ApiError.BadRequest("Недопустимый формат или размер обложки.");
    }

    const coverKey = `artists/${artistId}/releases/${releaseId}/cover.jpg`;
    const thumb1200Key = `artists/${artistId}/releases/${releaseId}/thumb_1200.jpg`;
    const thumb600Key = `artists/${artistId}/releases/${releaseId}/thumb_600.jpg`;

    await uploadFile(coverKey, fileBuffer, "image/jpeg");

    const thumb1200Buffer = await sharp(fileBuffer)
      .resize(1200, 1200, { fit: "inside" })
      .toFormat("jpeg")
      .toBuffer();
    await uploadFile(thumb1200Key, thumb1200Buffer, "image/jpeg");

    const thumb600Buffer = await sharp(fileBuffer)
      .resize(600, 600, { fit: "inside" })
      .toFormat("jpeg")
      .toBuffer();
    await uploadFile(thumb600Key, thumb600Buffer, "image/jpeg");
  }

  async uploadTrack(
    artistId,
    releaseId,
    trackOrder,
    trackTitle,
    fileBufferOrStream,
    fileType
  ) {
    const { parseBuffer } = await import("music-metadata");

    if (!["wav", "flac"].includes(fileType)) {
      throw new ApiError.BadRequest("Недопустимый формат файла трека.");
    }

    let fileBuffer;
    if (fileBufferOrStream instanceof Buffer) {
      fileBuffer = fileBufferOrStream;
    } else {
      fileBuffer = await this.streamToBuffer(fileBufferOrStream);
    }

    if (!(await validateAudioFile(fileBuffer))) {
      throw new ApiError.BadRequest("Недопустимые параметры аудиофайла.");
    }

    let duration;
    try {
      const metadata = await parseBuffer(fileBuffer, { skipCovers: true });
      duration = metadata.format.duration;
    } catch (err) {
      throw new ApiError.BadRequest(
        "Не удалось определить длительность трека."
      );
    }

    const trackFileName = `${trackOrder}-${trackTitle}.${fileType}`;
    const trackKey = `artists/${artistId}/releases/${releaseId}/tracks/${trackFileName}`;

    await uploadFile(trackKey, fileBuffer, `audio/${fileType}`);
    return {
      key: trackFileName,
      duration: duration,
    };
  }

  async getCover(artistId, releaseId, size = "original") {
    let key;

    switch (size) {
      case "original":
        key = `artists/${artistId}/releases/${releaseId}/cover.jpg`;
        break;
      case "1200":
        key = `artists/${artistId}/releases/${releaseId}/thumb_1200.jpg`;
        break;
      case "600":
        key = `artists/${artistId}/releases/${releaseId}/thumb_600.jpg`;
        break;
      default:
        throw new ApiError.BadRequest("Недопустимый размер обложки.");
    }

    if (!(await checkFileExists(key))) {
      throw new ApiError.NotFoundError("Обложка релиза не найдена.");
    }

    return getFileAsStream(key);
  }

  async getTrack(artistId, releaseId, trackFileName) {
    const trackKey = `artists/${artistId}/releases/${releaseId}/tracks/${trackFileName}`;

    if (!(await checkFileExists(trackKey))) {
      throw new ApiError.NotFoundError("Трек не найден.");
    }

    return getFileAsStream(trackKey);
  }

  async downloadFile(artistId, releaseId, filePath) {
    const key = `artists/${artistId}/releases/${releaseId}/${filePath}`;

    if (!(await checkFileExists(key))) {
      throw new ApiError.NotFoundError("Файл не найден.");
    }

    return this.getFileAsBuffer(key);
  }

  async deleteFile(artistId, releaseId, filePath) {
    const key = `artists/${artistId}/releases/${releaseId}/${filePath}`;

    if (!(await checkFileExists(key))) {
      throw new ApiError.NotFoundError("Файл не найден.");
    }

    await deleteFile(key);
  }

  async streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", (err) => reject(err));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  async getFileAsBuffer(key) {
    const params = {
      Bucket: process.env.YC_BUCKET_NAME,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error("Тело ответа отсутствует.");
      }

      const arrayBuffer = await response.Body.transformToByteArray();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Ошибка при получении файла как буфера:", error);
      throw ApiError.InternalServerError;
    }
  }
}

module.exports = new MediaService();
