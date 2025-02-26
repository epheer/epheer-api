const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const handleError = (
  res,
  message,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
) => {
  console.error(message);
  return res.status(statusCode).json({ message });
};

module.exports = {
  HTTP_STATUS,
  handleError,
};
