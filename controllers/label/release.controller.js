const releaseService = require("../../services/label/release.service");
const { Artist } = require("../../models");
const { HTTP_STATUS } = require("../../config/http-statuses");

class ReleaseController {
  async createRelease(req, res, next) {
    try {
      const artistId = req.params.id;
      const artist = await Artist.findOne({ user: artistId });
      const stageName = artist.stage_name;

      const createdRelease = await releaseService.createRelease(
        artistId,
        stageName
      );

      return res.status(HTTP_STATUS.CREATED).json(createdRelease);
    } catch (e) {
      next(e);
    }
  }

  async updateRelease(req, res, next) {
    try {
      const releaseId = req.params.id;
      const data = req.body;

      const updatedRelease = await releaseService.updateRelease(
        releaseId,
        data
      );

      return res.status(HTTP_STATUS.OK).json(updatedRelease);
    } catch (e) {
      next(e);
    }
  }

  async saveRelease(req, res, next) {
    try {
      const releaseId = req.params.id;

      const savedRelease = await releaseService.saveRelease(releaseId);

      return res.status(HTTP_STATUS.OK).json(savedRelease);
    } catch (e) {
      next(e);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const releaseId = req.params.id;
      const { status, userId, message } = req.body;

      const updatedStatus = await releaseService.updateStatus(
        releaseId,
        status,
        userId,
        message
      );

      return res.status(HTTP_STATUS.OK).json(updatedStatus);
    } catch (e) {
      next(e);
    }
  }

  async getReleaseById(req, res, next) {
    try {
      const releaseId = req.params.id;

      const release = await releaseService.getReleaseById(releaseId);

      return res.status(HTTP_STATUS.OK).json(release);
    } catch (e) {
      next(e);
    }
  }

  async getReleasesByArtists(req, res, next) {
    try {
      const artistIds = req.params.ids.split(",");
      const filterOptions = req.query.filter || {};
      const sortOptions = req.query.sort || {};
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const releases = await releaseService.getReleasesByArtists(
        artistIds,
        filterOptions,
        sortOptions,
        searchQuery,
        page,
        limit
      );

      return res.status(HTTP_STATUS.OK).json(releases);
    } catch (e) {
      next(e);
    }
  }

  async getAllReleases(req, res, next) {
    try {
      const filterOptions = req.query.filter || {};
      const sortOptions = req.query.sort || {};
      const searchQuery = req.query.search || "";
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const releases = await releaseService.getAllReleases(
        filterOptions,
        sortOptions,
        searchQuery,
        page,
        limit
      );

      return res.status(HTTP_STATUS.OK).json(releases);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new ReleaseController();
