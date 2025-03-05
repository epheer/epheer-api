const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();
const ApiError = require("../exceptions/api-error");

// Проверка обязательных переменных окружения
const requiredEnvVars = [
  "YC_ENDPOINT",
  "YC_ACCESS_KEY_ID",
  "YC_SECRET_ACCESS_KEY",
  "YC_BUCKET_NAME",
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new ApiError.InternalServerError();
}

// Настройка клиента S3 для работы с Yandex Cloud Object Storage
const s3Client = new S3Client({
  endpoint: process.env.YC_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YC_ACCESS_KEY_ID,
    secretAccessKey: process.env.YC_SECRET_ACCESS_KEY,
  },
  region: "ru-central1",
  forcePathStyle: true,
  signatureVersion: "v4",
  maxAttempts: 3,
});

const bucketName = process.env.YC_BUCKET_NAME;

/**
 * Загружает файл в Yandex Cloud Object Storage
 * @param {string} key - Имя файла в хранилище
 * @param {Buffer|ReadableStream} fileBufferOrStream - Буфер или поток файла
 * @param {string} contentType - MIME-тип файла
 * @returns {Promise<void>}
 */
const uploadFile = async (key, fileBufferOrStream, contentType) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileBufferOrStream,
    ContentType: contentType,
  };

  const startTime = Date.now();
  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    const duration = Date.now() - startTime;
    console.log(
      `Файл "${key}" успешно загружен. Размер: ${
        typeof fileBufferOrStream === "object" &&
        Buffer.isBuffer(fileBufferOrStream)
          ? fileBufferOrStream.length
          : "stream"
      } байт, Время: ${duration} мс.`
    );
  } catch (error) {
    console.error("Ошибка при загрузке файла:", error);
    throw ApiError.InternalServerError;
  }
};

/**
 * Получает файл из Yandex Cloud Object Storage
 * @param {string} key - Имя файла в хранилище
 * @returns {Promise<Buffer>} - Содержимое файла в виде буфера
 */
const getFile = async (key) => {
  const params = {
    Bucket: bucketName,
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
    if (error.name === "NoSuchKey") {
      console.error(`Файл "${key}" не найден.`);
      throw new ApiError.NotFoundError(`Файл "${key}" не найден.`);
    }
    console.error("Ошибка при получении файла:", error);
    throw ApiError.InternalServerError;
  }
};

/**
 * Получает файл из Yandex Cloud Object Storage как поток
 * @param {string} key - Имя файла в хранилище
 * @returns {Promise<ReadableStream>} - Поток файла
 */
const getFileAsStream = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("Тело ответа отсутствует.");
    }

    console.log(`Получен поток для файла "${key}".`);
    return response.Body;
  } catch (error) {
    if (error.name === "NoSuchKey") {
      console.error(`Файл "${key}" не найден.`);
      throw new ApiError.NotFoundError(`Файл "${key}" не найден.`);
    }
    console.error("Ошибка при получении файла через поток:", error);
    throw ApiError.InternalServerError;
  }
};

/**
 * Удаляет файл из Yandex Cloud Object Storage
 * @param {string} key - Имя файла в хранилище
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  const startTime = Date.now();
  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    const duration = Date.now() - startTime;
    console.log(`Файл "${key}" успешно удалён. Время: ${duration} мс.`);
  } catch (error) {
    console.error("Ошибка при удалении файла:", error);
    throw ApiError.InternalServerError;
  }
};

/**
 * Проверяет, существует ли файл в Yandex Cloud Object Storage
 * @param {string} key - Имя файла в хранилище
 * @returns {Promise<boolean>} - true, если файл существует, false — если нет
 */
const checkFileExists = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const command = new HeadObjectCommand(params);
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === "NotFound" || error.name === "NoSuchKey") {
      return false;
    }
    console.error("Ошибка при проверке существования файла:", error);
    throw ApiError.InternalServerError;
  }
};

module.exports = {
  uploadFile,
  getFile,
  getFileAsStream,
  deleteFile,
  checkFileExists,
};
