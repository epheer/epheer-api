const { User, Artist } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const ArtistDto = require("../../dtos/label/artist.dto");
const ManagerDto = require("../../dtos/label/manager.dto");

const MAX_LIMIT = 50;

class ArtistService {
  async #findUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.NotFoundError("Пользователь не найден");
    }
    return user;
  }

  async #findArtistById(id) {
    const artist = await Artist.findOne({ user: id });
    if (!artist) {
      throw ApiError.NotFoundError("Артист не найден");
    }
    return artist;
  }

  #buildFilter(filterOptions, searchQuery) {
    const filter = {};

    if (filterOptions.managerId) {
      filter.manager = filterOptions.managerId;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.$or = [
        { stage_name: searchRegex },
        { "userInfo.info.surname": searchRegex },
        { "userInfo.info.firstname": searchRegex },
      ];
    }

    return filter;
  }

  #buildSort(sortOptions) {
    const sort = {};

    if (sortOptions.stage_name) {
      sort.stage_name = sortOptions.stage_name === "asc" ? 1 : -1;
    }
    if (sortOptions.surname) {
      sort["userInfo.info.surname"] = sortOptions.surname === "asc" ? 1 : -1;
    }
    if (sortOptions.firstname) {
      sort["userInfo.info.firstname"] = sortOptions.firstname === "asc" ? 1 : -1;
    }
    if (sortOptions.createdAt) {
      sort["userInfo.createdAt"] = sortOptions.createdAt === "asc" ? 1 : -1;
    } else {
      sort["userInfo.createdAt"] = -1;
    }

    return sort;
  }

  async updateStageName(userId, stageName) {
    if (!stageName || typeof stageName !== "string") {
      throw ApiError.BadRequest("Имя артиста должно быть строкой");
    }

    let artist = await Artist.findOne({ user: userId });

    if (!artist) {
      const profile = await User.findOne({ _id: userId, role: "artist" });
      if (!profile) {
        throw ApiError.NotFoundError("Не найден профиль артиста");
      }
      artist = new Artist({
        user: userId,
        stage_name: stageName,
      });
      await artist.save();
      return artist.stage_name;
    }

    artist.stage_name = stageName;
    await artist.save();

    return artist.stage_name;
  }

  async linkManager(artistId, managerId) {
    const artist = await this.#findArtistById(artistId);
    const manager = await this.#findUserById(managerId);

    if (manager.role !== "manager" && manager.role !== "root") {
      throw ApiError.BadRequest(
          "Указанный пользователь не является менеджером"
      );
    }

    artist.manager = managerId;
    await artist.save();

    return artist.manager;
  }

  async getArtistsByIds(artistIds) {
    if (!Array.isArray(artistIds)) {
      throw ApiError.BadRequest("Неверный формат списка ID артистов");
    }

    if (artistIds.length === 0) {
      return [];
    }

    const artists = await Artist.find({ _id: { $in: artistIds } })
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

    return artists.map((artist) => new ArtistDto(artist));
  }

  async getAllArtists(filterOptions, sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, MAX_LIMIT);

    const matchStage = this.#buildFilter(filterOptions, searchQuery);
    const sortStage = this.#buildSort(sortOptions);
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },

      {
        $lookup: {
          from: "info",
          localField: "userInfo._id",
          foreignField: "user",
          as: "userInfo.info",
        },
      },
      { $unwind: { path: "$userInfo.info", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "manager",
          foreignField: "_id",
          as: "managerInfo",
        },
      },
      { $unwind: { path: "$managerInfo", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "info",
          localField: "managerInfo._id",
          foreignField: "user",
          as: "managerInfo.info",
        },
      },
      { $unwind: { path: "$managerInfo.info", preserveNullAndEmptyArrays: true } },

      { $match: matchStage },

      {
        $addFields: {
          id: "$userInfo._id",
          surname: "$userInfo.info.surname",
          firstname: "$userInfo.info.firstname",
          patronymic: "$userInfo.info.patronymic",
          contact: "$userInfo.info.contact",
          manager: {
            surname: "$managerInfo.info.surname",
            firstname: "$managerInfo.info.firstname",
            patronymic: "$managerInfo.info.patronymic",
            contact: "$managerInfo.info.contact",
          },
        },
      },

      { $sort: sortStage },

      { $skip: skip },
      { $limit: limit },
    ];

    const artists = await Artist.aggregate(pipeline);
    const formattedArtists = artists.map((artist) => new ArtistDto(artist));

    const totalPipeline = [...pipeline.slice(0, 6), { $count: "total" }];
    const totalResult = await Artist.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedArtists,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }
}

module.exports = new ArtistService();