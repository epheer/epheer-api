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
        { "user.info.surname": searchRegex },
        { "user.info.firstname": searchRegex },
      ];
    }
    return filter;
  }

  #buildSort(sortOptions) {
    const sort = {};
    if (sortOptions.surname) {
      sort["user.info.surname"] = sortOptions.surname === "asc" ? 1 : -1;
    }
    if (sortOptions.firstname) {
      sort["user.info.firstname"] = sortOptions.firstname === "asc" ? 1 : -1;
    }
    if (sortOptions.createdAt) {
      sort["user.createdAt"] = sortOptions.createdAt === "asc" ? 1 : -1;
    } else {
      sort["user.createdAt"] = -1;
    }
    return sort;
  }

  async getAllManagers(sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, MAX_LIMIT);

    const filter = this.#buildFilter(searchQuery);
    const sort = this.#buildSort(sortOptions);
    const skip = (page - 1) * limit;

    const managers = await User.find({
      ...filter,
      $or: [{ role: "root" }, { role: "manager" }],
    })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    if (managers.length === 0) {
      throw ApiError.NotFoundError("Менеджеры не найдены");
    }

    const total = await User.countDocuments(filter);
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
