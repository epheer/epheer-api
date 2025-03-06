const trackService = require("../../services/label/track.service");
const { HTTP_STATUS } = require("../../config/http-statuses");

class TrackController {
  async createTrack(req, res, next) {
    try {
      const releaseId = req.params.id;
      const { fileKey, duration } = req.body;

      const createdTrack = await trackService.createTrack(
        releaseId,
        fileKey,
        duration
      );

      return res.status(HTTP_STATUS.CREATED).json(createdTrack);
    } catch (e) {
      next(e);
    }
  }

  async updateTrack(req, res, next) {
    try {
      const trackId = req.params.trackId;
      const data = req.body;

      const updatedTrack = await trackService.updateTrack(trackId, data);

      return res.status(HTTP_STATUS.OK).json(updatedTrack);
    } catch (e) {
      next(e);
    }
  }

  async reorderTracks(req, res, next) {
    try {
      const releaseId = req.params.id;
      const newOrder = req.body.newOrder;

      const result = await trackService.reorderTracks(releaseId, newOrder);

      return res.status(HTTP_STATUS.OK).json(result);
    } catch (e) {
      next(e);
    }
  }

  async deleteTrack(req, res, next) {
    try {
      const trackId = req.params.trackId;

      const result = await trackService.deleteTrack(trackId);

      return res.status(HTTP_STATUS.OK).json(result);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new TrackController();
