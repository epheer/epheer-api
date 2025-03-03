const artistService = require("../../services/label/artist.service");
const { HTTP_STATUS } = require("../../config/http-status");

class ArtistController {
  async updateStageName(req, res, next) {
    try {
      const userId = req.params.id;
      const { stageName } = req.body;

      const updatedStageName = await artistService.updateStageName(
        userId,
        stageName
      );

      return res.status(HTTP_STATUS.OK).json(updatedStageName);
    } catch (e) {
      next(e);
    }
  }

  async linkManager(req, res, next) {
    try {
      const artistId = req.params.artistId;
      const { managerId } = req.body;

      const artist = await artistService.linkManager(artistId, managerId);

      return res.status(HTTP_STATUS.OK).json(artist);
    } catch (e) {
      next(e);
    }
  }

  async getArtistsByIds(req, res, next) {
    try {
      const artistIds = req.params.ids.split(",");

      const artists = await artistService.getArtistsByIds(artistIds);

      return res.status(HTTP_STATUS.OK).json(artists);
    } catch (e) {
      next(e);
    }
  }

  async getAllArtists(req, res, next) {
    try {
      const filterOptions = req.query.filter || {};
      const sortOptions = req.query.sort || {};
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const artists = await artistService.getAllArtists(
        filterOptions,
        sortOptions,
        searchQuery,
        page,
        limit
      );

      return res.status(HTTP_STATUS.OK).json(artists);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new ArtistController();
