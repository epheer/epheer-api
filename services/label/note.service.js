const { Note, Release } = require("../../models");
const ApiError = require("../../exceptions/api-error");

class NoteService {
  async updateOrCreateNote(releaseId, data) {
    const allowedFields = ["focus_tracks", "pitched", "comment"];

    const release = await Release.findById(releaseId);
    if (!release) {
      throw new ApiError.NotFoundError("Релиз не найден");
    }

    if (
      release.status.label === "draft" ||
      release.status.label === "finalized"
    ) {
      throw new ApiError.BadRequest(
        "Можно обновлять примечания только в релизах, находящихся в обработке."
      );
    }

    if (data.focus_tracks && Array.isArray(data.focus_tracks)) {
      const trackIdsInRelease = release.tracks.map((track) =>
        track._id.toString()
      );
      const providedTrackIds = data.focus_tracks.map((id) => id.toString());

      const invalidTrackIds = providedTrackIds.filter(
        (id) => !trackIdsInRelease.includes(id)
      );

      if (invalidTrackIds.length > 0) {
        throw new ApiError.BadRequest(
          `Треки с ID ${invalidTrackIds.join(
            ", "
          )} не принадлежат указанному релизу`
        );
      }
    }

    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    try {
      let note = await Note.findOne({ release_id: releaseId });

      if (!note) {
        note = new Note({
          release_id: releaseId,
          ...updateData,
        });
        await note.save();
      } else {
        await Note.updateOne(
          { _id: note._id },
          { $set: updateData },
          { new: true }
        );
      }

      return note;
    } catch (error) {
      throw new ApiError.InternalServerError(
        "Произошла ошибка при обновлении/создании заметки"
      );
    }
  }

  async getNoteByReleaseId(releaseId) {
    try {
      const release = await Release.findById(releaseId);
      if (!release) {
        throw new ApiError.NotFoundError("Релиз не найден");
      }

      const note = await Note.findOne({ release_id: releaseId })
        .select("-_id")
        .exec();

      if (!note) {
        throw new ApiError.NotFoundError("Примечаний ещё нет");
      }

      return note;
    } catch (error) {
      throw new ApiError.InternalServerError(
        "Произошла ошибка при получении заметки"
      );
    }
  }
}

module.exports = new NoteService();
