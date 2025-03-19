const { User, Artist } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const ArtistDto = require("../../dtos/label/artist.dto");
const ManagerDto = require("../../dtos/label/manager.dto");

const MAX_LIMIT = 50;

class ManagerService {
  async #getArtistsByManagerId(managerId) {
    const artists = await Artist.find({ manager: managerId })
      .populate({
        path: "user",
        select: "-hash",
        populate: {
          path: "info",
          model: "Info",
        },
      })
      .populate({
        path: "manager",
        select: "-hash",
        populate: {
          path: "info",
          model: "Info",
        },
      })
      .exec();

    if (artists.length === 0) {
      throw ApiError.NotFoundError("Артисты не найдены");
    }

    return artists.map((artist) => new ArtistDto(artist));
  }

  async getArtistsByManager(managerId) {
    return this.#getArtistsByManagerId(managerId);
  }

  #buildFilter(searchQuery) {
    const filter = {};
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.$or = [
        { "info.surname": searchRegex },
        { "info.firstname": searchRegex },
      ];
    }
    return filter;
  }

  #buildSort(sortOptions) {
    const sort = {};
    if (sortOptions.surname) {
      sort["info.surname"] = sortOptions.surname === "asc" ? 1 : -1;
    }
    if (sortOptions.firstname) {
      sort["info.firstname"] = sortOptions.firstname === "asc" ? 1 : -1;
    }
    if (sortOptions.createdAt) {
      sort["createdAt"] = sortOptions.createdAt === "asc" ? 1 : -1;
    } else {
      sort["createdAt"] = -1;
    }
    return sort;
  }

  async getAllManagers(sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, MAX_LIMIT);

    const matchStage = this.#buildFilter(searchQuery);
    const sortStage = this.#buildSort(sortOptions);
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          $or: [{ role: "root" }, { role: "manager" }],
        },
      },
      {
        $lookup: {
          from: "info",
          localField: "info",
          foreignField: "_id",
          as: "info",
        },
      },
      { $unwind: "$info" },
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    const managers = await User.aggregate(pipeline);

    const totalPipeline = [...pipeline.slice(0, 4), { $count: "total" }];
    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: managers.map((manager) => new ManagerDto(manager)),
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }
}

module.exports = new ManagerService();
