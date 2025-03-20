const { Info } = require("../../models");
const { InfoDto, FullInfoDto } = require("../../dtos/users/info.dto");
const ApiError = require("../../exceptions/api-error");

const MAX_LIMIT = 50;

class InfoService {
  #processFields(data) {
    const allowedFields = ["surname", "firstname", "patronymic", "contact"];
    return allowedFields.reduce((acc, field) => {
      if (data[field] !== undefined) {
        acc[field] = data[field];
      }
      return acc;
    }, {});
  }

  async updateInfo(userId, data) {
    if (!data.surname || !data.firstname) {
      throw new ApiError.BadRequest("Отсутствуют обязательные поля");
    }

    let info = await Info.findOne({ user: userId });

    if (info) {
      Object.assign(info, this.#processFields(data));
      await info.save();
    } else {
      info = await Info.create({
        user: userId,
        ...this.#processFields(data),
      });
    }

    return new InfoDto(info);
  }

  async getUsersByIds(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ApiError.BadRequest(
          "Неверный формат или пустой список ID пользователей"
      );
    }

    const infos = await Info.find({ user: { $in: userIds } })
        .populate("user", "-hash")
        .exec();

    return infos.map((info) => new FullInfoDto(info));
  }

  #buildFilter(filterOptions, searchQuery) {
    const filter = {};
    if (filterOptions.role) {
      filter["userInfo.role"] = filterOptions.role;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.$or = [
        { "userInfo.login": searchRegex },
        { "userInfo.email": searchRegex },
        { surname: searchRegex },
        { firstname: searchRegex },
        { contact: searchRegex },
      ];
    }

    return filter;
  }

  #buildSort(sortOptions) {
    const sort = {};
    if (sortOptions.createdAt) {
      sort["userInfo.createdAt"] = sortOptions.createdAt === "asc" ? 1 : -1;
    }
    if (sortOptions.role) {
      sort["userInfo.role"] = sortOptions.role === "asc" ? 1 : -1;
    }
    return sort;
  }

  async getAllUsers(filterOptions, sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw new ApiError.BadRequest("Неверные параметры пагинации");
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

      { $match: matchStage },

      {
        $addFields: {
          id: "$_id",
          login: "$userInfo.login",
          role: "$userInfo.role",
          email: "$userInfo.email",
          is_active: "$userInfo.is_active",
          createdAt: "$userInfo.createdAt",
        },
      },

      { $sort: sortStage },

      { $skip: skip },
      { $limit: limit },
    ];

    const infos = await Info.aggregate(pipeline);

    const totalPipeline = [...pipeline.slice(0, 3), { $count: "total" }];
    const totalResult = await Info.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: infos.map((info) => ({
        id: info.id,
        login: info.login,
        role: info.role,
        surname: info.surname,
        firstname: info.firstname,
        patronymic: info.patronymic,
        contact: info.contact,
        email: info.email,
        is_active: info.is_active,
        createdAt: info.createdAt,
      })),
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }
}

module.exports = new InfoService();