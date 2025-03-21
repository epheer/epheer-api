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
      throw ApiError.BadRequest(`Неверные параметры пагинации: page=${page}, limit=${limit}`);
    }

    limit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    // Фильтр для поиска пользователей с ролями root или manager
    const userMatchStage = {
      $match: {
        role: { $in: ["root", "manager"] },
      },
    };

    // Объединение данных из коллекции Info через поле user
    const lookupStage = {
      $lookup: {
        from: "info", // Коллекция Info
        localField: "_id", // Поле _id в User
        foreignField: "user", // Поле user в Info
        as: "info", // Результат объединения
      },
    };

    // Развертывание массива info (предполагается, что связь один-к-одному)
    const unwindStage = { $unwind: "$info" };

    // Дополнительная фильтрация по searchQuery
    const filterStage = this.#buildFilter(searchQuery);

    // Сортировка
    const sortStage = this.#buildSort(sortOptions);

    // Построение pipeline
    const pipeline = [
      userMatchStage,
      lookupStage,
      unwindStage,
      { $match: filterStage },
      {
        $addFields: {
          id: "$_id",
          surname: "$info.surname",
          firstname: "$info.firstname",
          patronymic: "$info.patronymic",
          contact: "$info.contact",
        },
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
    ];

    const managers = await User.aggregate(pipeline);

    if (managers.length === 0) {
      throw ApiError.NotFoundError("Менеджеры не найдены");
    }

    const formattedManagers = managers.map((manager) => new ManagerDto(manager));

    const totalPipeline = [
      userMatchStage,
      lookupStage,
      unwindStage,
      { $match: filterStage },
      { $count: "total" },
    ];
    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedManagers,
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