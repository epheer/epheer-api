const infoService = require("../../services/users/info.service");
const { HTTP_STATUS } = require("../../config/http-statuses");
const qs = require("qs");

class InfoController {
  async updateInfo(req, res, next) {
    try {
      const userId = req.params.id;
      const data = req.body;

      const updatedInfo = await infoService.updateInfo(userId, data);

      return res.status(HTTP_STATUS.OK).json(updatedInfo);
    } catch (e) {
      next(e);
    }
  }

  async getUsersByIds(req, res, next) {
    try {
      const userIds = req.params.ids.split(",");

      const usersInfo = await infoService.getUsersByIds(userIds);

      return res.status(HTTP_STATUS.OK).json(usersInfo);
    } catch (e) {
      next(e);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const filterOptions = req.query.filter || {};
      const sortOptions = req.query.sort || {};
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const usersInfo = await infoService.getAllUsers(
        filterOptions,
        sortOptions,
        searchQuery,
        page,
        limit
      );

      return res.status(HTTP_STATUS.OK).json(usersInfo);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new InfoController();
