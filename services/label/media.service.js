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
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({ region: process.env.YC_REGION });

const COVER_SIZES = {
  ORIGINAL: "original",
  LARGE: 1200,
  MEDIUM: 600,
};

class MediaService {
  #getFileKey(artistId, releaseId, filePath) {
    return `artists/${artistId}/releases/${releaseId}/${filePath}`;
  }

  async uploadCover(artistId, releaseId, fileBuffer) {
    if (!(await validateImageFile(fileBuffer))) {
      throw new ApiError.BadRequest("Недопустимый формат или размер обложки.");
    }

    const coverKey = this.#getFileKey(artistId, releaseId, "cover.jpg");
    const thumb1200Key = this.#getFileKey(
      artistId,
      releaseId,
      `thumb_${COVER_SIZES.LARGE}.jpg`
    );
    const thumb600Key = this.#getFileKey(
      artistId,
      releaseId,
      `thumb_${COVER_SIZES.MEDIUM}.jpg`
    );

    await uploadFile(coverKey, fileBuffer, "image/jpeg");

    const thumb1200Buffer = await sharp(fileBuffer)
      .resize(COVER_SIZES.LARGE, COVER_SIZES.LARGE, { fit: "inside" })
      .toFormat("jpeg")
      .toBuffer();
    await uploadFile(thumb1200Key, thumb1200Buffer, "image/jpeg");

    const thumb600Buffer = await sharp(fileBuffer)
      .resize(COVER_SIZES.MEDIUM, COVER_SIZES.MEDIUM, { fit: "inside" })
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
    const trackKey = this.#getFileKey(
      artistId,
      releaseId,
      `tracks/${trackFileName}`
    );

    await uploadFile(trackKey, fileBuffer, `audio/${fileType}`);
    return {
      key: trackFileName,
      duration: duration,
    };
  }

  async getCover(artistId, releaseId, size = "original") {
    let key;

    switch (size) {
      case COVER_SIZES.ORIGINAL:
        key = this.#getFileKey(artistId, releaseId, "cover.jpg");
        break;
      case COVER_SIZES.LARGE.toString():
        key = this.#getFileKey(
          artistId,
          releaseId,
          `thumb_${COVER_SIZES.LARGE}.jpg`
        );
        break;
      case COVER_SIZES.MEDIUM.toString():
        key = this.#getFileKey(
          artistId,
          releaseId,
          `thumb_${COVER_SIZES.MEDIUM}.jpg`
        );
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
    const trackKey = this.#getFileKey(
      artistId,
      releaseId,
      `tracks/${trackFileName}`
    );

    if (!(await checkFileExists(trackKey))) {
      throw new ApiError.NotFoundError("Трек не найден.");
    }

    return getFileAsStream(trackKey);
  }

  async downloadFile(artistId, releaseId, filePath) {
    const key = this.#getFileKey(artistId, releaseId, filePath);

    if (!(await checkFileExists(key))) {
      throw new ApiError.NotFoundError("Файл не найден.");
    }

    return this.getFileAsBuffer(key);
  }

  async deleteFile(artistId, releaseId, filePath) {
    const key = this.#getFileKey(artistId, releaseId, filePath);

    if (!(await checkFileExists(key))) {
      throw new ApiError.NotFoundError("Файл не найден.");
    }

    await deleteFile(key);
  }

  async streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", (err) => {
        console.error("Ошибка при чтении потока:", err.message);
        reject(err);
      });
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
