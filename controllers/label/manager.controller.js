const ManagerService = require("../../services/label/manager.service");
const { HTTP_STATUS } = require("../../config/http-statuses");

class ManagerController {
  async getArtistsByManager(req, res, next) {
    try {
      const managerId = req.params.id;

      if (!managerId) {
        return next(new ApiError.BadRequest("Не указан ID менеджера"));
      }

      const artists = await ManagerService.getArtistsByManager(managerId);

      return res.status(HTTP_STATUS.OK).json(artists);
    } catch (error) {
      next(error);
    }
  }

  async getAllManagers(req, res, next) {
    try {
      const sortOptions = req.query.sort || {};
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await ManagerService.getAllManagers(
        sortOptions,
        searchQuery,
        page,
        limit
      );

      return res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ManagerController();
