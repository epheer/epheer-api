const qs = require('qs');
const ApiError = require("../exceptions/api-error");

module.exports = function (req, res, next) {
    try {
        const queryString = req.url.split('?')[1];
        const parsedQuery = qs.parse(queryString);

        req.query = parsedQuery;
    } catch (error) {
        throw ApiError.InternalServerError(`Ошибка при парсинге query: ${error}`)
    }

    next();
}