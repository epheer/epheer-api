const { Release, Track } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const { deleteFile } = require("../../config/storage");

class TrackService {
  async createTrack(releaseId, fileKey, duration) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const release = await Release.findById(releaseId)
        .populate("tracks")
        .session(session);
      if (!release) {
        throw new ApiError.NotFoundError("Релиз не найден");
      }
      if (release.status.label !== "draft") {
        throw new ApiError.BadRequest(
          "Можно создавать треки только в черновых релизах"
        );
      }

      const maxIndex = release.tracks.reduce(
        (max, track) => Math.max(max, track.index),
        0
      );
      const index = maxIndex + 1;

      const track = new Track({
        release: releaseId,
        index,
        file: {
          key: fileKey,
          duration,
        },
      });

      await track.save({ session });
      await session.commitTransaction();
      return track;
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError.InternalServerError(
        "Произошла ошибка при создании трека"
      );
    } finally {
      session.endSession();
    }
  }

  async updateTrack(trackId, data) {
    const allowedFields = [
      "name",
      "feat",
      "authors",
      "lyrics",
      "explicit",
      "isrc",
    ];

    let track = await Track.findById(trackId).populate("release");
    if (!track) {
      throw new ApiError.NotFoundError("Трек не найден");
    }

    if (track.release.status.label !== "draft") {
      throw new ApiError.BadRequest(
        "Можно обновлять треки только в черновых релизах"
      );
    }

    const updateData = {};
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    if (Object.keys(updateData).length > 0) {
      await Track.findByIdAndUpdate(
        trackId,
        { $set: updateData },
        { new: true }
      );
    }

    return track;
  }

  async reorderTracks(releaseId, newOrder) {
    if (!newOrder || newOrder.length === 0) {
      throw new ApiError.BadRequest(
        "Новый порядок треков не может быть пустым"
      );
    }
    const { Release, Track } = require("../../models");
    const ApiError = require("../../exceptions/api-error");
    const { deleteFile } = require("../../config/storage");
    const mongoose = require("mongoose");

    class TrackService {
      #validateReleaseStatus(release, allowedStatus = "draft") {
        if (release.status.label !== allowedStatus) {
          throw new ApiError.BadRequest(
            `Действие разрешено только для релизов со статусом "${allowedStatus}"`
          );
        }
      }

      #validateNewOrder(currentTrackIds, newOrder) {
        if (!newOrder || newOrder.length === 0) {
          throw new ApiError.BadRequest(
            "Новый порядок треков не может быть пустым"
          );
        }

        if (new Set(newOrder).size !== newOrder.length) {
          throw new ApiError.BadRequest(
            "Новый порядок содержит дублирующиеся треки"
          );
        }

        if (!newOrder.every((id) => currentTrackIds.includes(id))) {
          throw new ApiError.BadRequest("Некоторые треки отсутствуют в релизе");
        }

        if (currentTrackIds.length !== newOrder.length) {
          throw new ApiError.BadRequest(
            "Количество треков в новом порядке не совпадает с текущим"
          );
        }
      }

      async createTrack(releaseId, fileKey, duration) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const release = await Release.findById(releaseId)
            .populate("tracks")
            .session(session);
          if (!release) {
            throw new ApiError.NotFoundError("Релиз не найден");
          }

          this.#validateReleaseStatus(release);

          const maxIndex = release.tracks.reduce(
            (max, track) => Math.max(max, track.index),
            0
          );
          const index = maxIndex + 1;

          const track = new Track({
            release: releaseId,
            index,
            file: {
              key: fileKey,
              duration,
            },
          });

          await track.save({ session });
          await session.commitTransaction();
          return track;
        } catch (error) {
          await session.abortTransaction();
          throw new ApiError.InternalServerError(
            "Произошла ошибка при создании трека"
          );
        } finally {
          session.endSession();
        }
      }

      async updateTrack(trackId, data) {
        const allowedFields = [
          "name",
          "feat",
          "authors",
          "lyrics",
          "explicit",
          "isrc",
        ];

        let track = await Track.findById(trackId).populate("release");
        if (!track) {
          throw new ApiError.NotFoundError("Трек не найден");
        }

        this.#validateReleaseStatus(track.release);

        const updateData = {};
        allowedFields.forEach((field) => {
          if (data[field] !== undefined) {
            updateData[field] = data[field];
          }
        });

        if (Object.keys(updateData).length > 0) {
          await Track.findByIdAndUpdate(
            trackId,
            { $set: updateData },
            { new: true }
          );
        }

        return track;
      }

      async reorderTracks(releaseId, newOrder) {
        const release = await Release.findById(releaseId).populate("tracks");
        if (!release) {
          throw new ApiError.NotFoundError("Релиз не найден");
        }

        this.#validateReleaseStatus(release);

        const tracks = await Track.find({ release: releaseId }).sort({
          index: 1,
        });
        const currentTrackIds = tracks.map((track) => track._id.toString());

        this.#validateNewOrder(currentTrackIds, newOrder);

        const updates = newOrder.map((trackId, newIndex) => ({
          updateOne: {
            filter: { _id: trackId },
            update: { $set: { index: newIndex + 1 } },
          },
        }));

        await Track.bulkWrite(updates);

        return { message: "Порядок треков успешно обновлен" };
      }

      async deleteTrack(trackId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const track = await Track.findById(trackId)
            .populate("release")
            .session(session);
          if (!track) {
            throw new ApiError.NotFoundError("Трек не найден");
          }

          this.#validateReleaseStatus(track.release);

          const artistId = track.release.artist.user_id;
          const releaseId = track.release._id;
          const trackKey = track.file.key;

          const s3Key = `artists/${artistId}/releases/${releaseId}/tracks/${trackKey}`;

          await Track.findByIdAndDelete(trackId).session(session);

          const remainingTracks = await Track.find({ release: releaseId })
            .sort({ index: 1 })
            .session(session);
          if (remainingTracks.length > 1) {
            const updates = remainingTracks.map((track, newIndex) => ({
              updateOne: {
                filter: { _id: track._id },
                update: { $set: { index: newIndex + 1 } },
              },
            }));

            if (updates.length > 0) {
              await Track.bulkWrite(updates, { session });
            }
          }

          await session.commitTransaction();

          try {
            await deleteFile(s3Key);
          } catch (error) {
            console.error(
              "Не удалось удалить файл из хранилища:",
              error.message
            );
          }

          return { message: "Трек успешно удален" };
        } catch (error) {
          await session.abortTransaction();
          throw new ApiError.InternalServerError(
            "Произошла ошибка при удалении трека"
          );
        } finally {
          session.endSession();
        }
      }
    }

    module.exports = new TrackService();

    const release = await Release.findById(releaseId).populate("tracks");
    if (!release) {
      throw new ApiError.NotFoundError("Релиз не найден");
    }
    if (release.status.label !== "draft") {
      throw new ApiError.BadRequest(
        "Можно изменять порядок треков только в черновых релизах"
      );
    }

    const tracks = await Track.find({ release: releaseId }).sort({ index: 1 });

    const trackIdsInRelease = tracks.map((track) => track._id.toString());
    const providedTrackIds = newOrder;

    if (new Set(providedTrackIds).size !== providedTrackIds.length) {
      throw new ApiError.BadRequest(
        "Новый порядок содержит дублирующиеся треки"
      );
    }

    if (!providedTrackIds.every((id) => trackIdsInRelease.includes(id))) {
      throw new ApiError.BadRequest("Некоторые треки отсутствуют в релизе");
    }

    if (trackIdsInRelease.length !== providedTrackIds.length) {
      throw new ApiError.BadRequest(
        "Количество треков в новом порядке не совпадает с текущим"
      );
    }

    const updates = newOrder.map((trackId, newIndex) => ({
      updateOne: {
        filter: { _id: trackId },
        update: { $set: { index: newIndex + 1 } },
      },
    }));

    await Track.bulkWrite(updates);

    return { message: "Порядок треков успешно обновлен" };
  }

  async deleteTrack(trackId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const track = await Track.findById(trackId)
        .populate("release")
        .session(session);
      if (!track) {
        throw new ApiError.NotFoundError("Трек не найден");
      }

      if (track.release.status.label !== "draft") {
        throw new ApiError.BadRequest(
          "Можно удалять треки только из черновых релизов"
        );
      }

      const artistId = track.release.artist.user_id;
      const releaseId = track.release._id;
      const trackKey = track.file.key;

      const s3Key = `artists/${artistId}/releases/${releaseId}/tracks/${trackKey}`;
      try {
        await deleteFile(s3Key);
      } catch (error) {
        await session.abortTransaction();
        throw new ApiError.InternalServerError(
          "Не удалось удалить файл из хранилища."
        );
      }

      await Track.findByIdAndDelete(trackId).session(session);

      const remainingTracks = await Track.find({ release: releaseId })
        .sort({ index: 1 })
        .session(session);
      if (remainingTracks.length > 1) {
        const updates = remainingTracks.map((track, newIndex) => ({
          updateOne: {
            filter: { _id: track._id },
            update: { $set: { index: newIndex + 1 } },
          },
        }));

        if (updates.length > 0) {
          await Track.bulkWrite(updates, { session });
        }
      }

      await session.commitTransaction();
      return { message: "Трек успешно удален" };
    } catch (error) {
      await session.abortTransaction();
      throw new ApiError.InternalServerError(
        "Произошла ошибка при удалении трека"
      );
    } finally {
      session.endSession();
    }
  }
}

module.exports = new TrackService();
