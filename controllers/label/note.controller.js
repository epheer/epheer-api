const noteService = require("../../services/label/note.service");
const ApiError = require("../../exceptions/api-error");
const { HTTP_STATUS } = require("../../config/http-statuses");

class NoteController {
  async updateNote(req, res, next) {
    try {
      const releaseId = req.params.id;
      const { focus_tracks, pitched, comment } = req.body;

      if (!focus_tracks && !pitched && !comment) {
        return next(
          new ApiError.BadRequest("Должен быть передан хотя бы один параметр")
        );
      }

      const updatedNote = await noteService.updateOrCreateNote(releaseId, {
        focus_tracks,
        pitched,
        comment,
      });

      return res.status(HTTP_STATUS.CREATED).json(updatedNote);
    } catch (error) {
      next(error);
    }
  }

  async getNote(req, res, next) {
    try {
      const releaseId = req.params.id;
      const note = await noteService.getNoteByReleaseId(releaseId);
      return res.status(HTTP_STATUS.OK).json(note);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NoteController();
