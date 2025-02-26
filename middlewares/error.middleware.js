const ApiError = require("../exceptions/api-error");
const { HTTP_STATUS } = require("../config/http-statuses");

module.exports = function (err, req, res, next) {
  console.log(err);
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ message: err.message, errors: err.errors });
  }
  return res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json({ message: "Непредвиденная ошибка" });
};
