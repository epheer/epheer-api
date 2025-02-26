const { HTTP_STATUS } = require("../config/http-statuses");

module.exports = class ApiError extends Error {
  status;
  errors;

  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  static UnauthorizedError() {
    return new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      "Пользователь не авторизован"
    );
  }

  static BadRequest(message = "Некорректный запрос", errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static NotFoundError(message = "Запрашиваемый ресурс не найден") {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  static ConflictError(message = "Конфликт") {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  static InternalServerError(message = "Ошибка сервера") {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
  }
};
