const { Release } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const { ReleaseDto, FullReleaseDto } = require("../../dtos/label/release.dto");

const MAX_LIMIT = 50;

class ReleaseService {
  #updateStatusHistory(release, status, userId, message) {
    release.status.label = status;
    release.status.message = message;
    release.status.history.push({
      editor: userId,
      status: {
        label: status,
        message,
      },
    });
  }

  async createRelease(artistId, stageName) {
    const existingDraft = await Release.findOne({
      "artist.user_id": artistId,
      "status.label": "draft",
    });

    if (existingDraft) {
      throw new ApiError.BadRequest(
        "Черновик релиза уже существует, удалите его или продолжайте его редактирование"
      );
    }

    const release = new Release({
      artist: {
        user_id: artistId,
        stage_name: stageName,
      },
      status: {
        label: "draft",
        message: "",
        history: [],
      },
    });

    await release.save();
    return { id: release._id, artist: release.artist };
  }

  async updateRelease(releaseId, data) {
    const allowedFields = [
      "name",
      "type",
      "date",
      "cover_key",
      "feat",
      "authors",
      "upc",
    ];

    let release = await Release.findById(releaseId);

    if (!release) {
      throw new ApiError.NotFoundError("Релиз не найден");
    }

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        release[field] = data[field];
      }
    });

    if (data.artist && data.artist.user_id && data.artist.stage_name) {
      release.artist = data.artist;
    }

    release.status.label = "draft";
    release.status.message = "";
    release.status.history.push({
      editor: release.artist.user_id,
      status: {
        label: "draft",
        message: "",
      },
    });

    await release.save();

    return new FullReleaseDto(release);
  }

  async saveRelease(releaseId) {
    const release = await Release.findById(releaseId).populate("tracks");

    if (!release) {
      throw new ApiError.NotFoundError("Релиз не найден");
    }

    const requiredFields = ["name", "type", "date", "cover_key", "authors"];
    for (const field of requiredFields) {
      if (!release[field]) {
        throw new ApiError.BadRequest(
          `Отсутствует обязательное поле: ${field}`
        );
      }
    }

    const minTracks = {
      single: 1,
      ep: 3,
      album: 7,
    };

    if (!release.tracks || release.tracks.length < minTracks[release.type]) {
      throw new ApiError.BadRequest(
        `Требуется минимум ${
          minTracks[release.type]
        } треков для выбранного типа релиза`
      );
    }

    release.status.label = "pending";
    release.status.message = "";
    release.status.history.push({
      editor: release.artist.user_id,
      status: {
        label: "pending",
        message: "",
      },
    });

    await release.save();

    return new FullReleaseDto(release);
  }

  async updateStatus(releaseId, status, userId, message = "") {
    const validStatuses = [
      "draft",
      "pending",
      "approved",
      "rejected",
      "delivered",
      "finalized",
    ];

    if (!validStatuses.includes(status)) {
      throw new ApiError.BadRequest("Недопустимый статус релиза");
    }

    const release = await Release.findById(releaseId);

    if (!release) {
      throw new ApiError.NotFoundError("Релиз не найден");
    }

    this.#updateStatusHistory(release, status, userId, message);
    await release.save();

    return new FullReleaseDto(release);
  }

  async getReleaseById(releaseId) {
    const release = await Release.findById(releaseId).populate("tracks");

    if (!release) {
      throw new ApiError.NotFoundError("Релиз не найден");
    }

    return new FullReleaseDto(release);
  }

  #buildFilter(filterOptions, searchQuery, artistIds = null) {
    const filter = {};

    if (artistIds) {
      filter["artist.user_id"] = { $in: artistIds };
    }

    if (filterOptions.status) {
      filter["status.label"] = filterOptions.status;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.$or = [
        { name: searchRegex },
        { "artist.stage_name": searchRegex },
      ];
    }

    return filter;
  }

  #buildSort(sortOptions, statusOrder) {
    const sort = {};

    sort.$expr = {
      $switch: {
        branches: Object.entries(statusOrder).map(([label, value]) => ({
          case: { $eq: ["$status.label", label] },
          then: value,
        })),
        default: 7,
      },
    };

    sort.createdAt = -1;

    if (sortOptions.name) {
      sort.name = sortOptions.name === "asc" ? 1 : -1;
    }

    if (sortOptions.stage_name) {
      sort["artist.stage_name"] = sortOptions.stage_name === "asc" ? 1 : -1;
    }

    return sort;
  }

  async #paginate(filter, sort, page, limit) {
    if (page < 1 || limit < 1) {
      throw new ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const releases = await Release.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    if (releases.length === 0) {
      throw new ApiError.NotFoundError("Релизы не найдены");
    }

    const total = await Release.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const dtoReleases = releases.map((release) => new ReleaseDto(release));

    return {
      data: dtoReleases,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }

  async getReleasesByArtists(
    artistIds,
    filterOptions,
    sortOptions,
    searchQuery,
    page,
    limit
  ) {
    const statusOrder = {
      pending: 1,
      approved: 2,
      delivered: 3,
      rejected: 4,
      finalized: 5,
      draft: 6,
    };

    const filter = this.#buildFilter(filterOptions, searchQuery, artistIds);
    const sort = this.#buildSort(sortOptions, statusOrder);

    return this.#paginate(filter, sort, page, limit);
  }

  async getAllReleases(filterOptions, sortOptions, searchQuery, page, limit) {
    const statusOrder = {
      pending: 1,
      approved: 2,
      delivered: 3,
      rejected: 4,
      finalized: 5,
      draft: 6,
    };

    const filter = this.#buildFilter(filterOptions, searchQuery);
    const sort = this.#buildSort(sortOptions, statusOrder);

    return this.#paginate(filter, sort, page, limit);
  }
}

module.exports = new ReleaseService();
