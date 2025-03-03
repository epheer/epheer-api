const { Info } = require("../../models");
const { InfoDto, FullInfoDto } = require("../../dtos/users/info.dto");
const ApiError = require("../../exceptions/api-error");

class InfoService {
  async updateInfo(userId, data) {
    const allowedFields = ["surname", "firstname", "patronymic", "contact"];

    if (!data.surname || !data.firstname) {
      throw new ApiError.BadRequest("Отсутствуют обязательные поля");
    }

    let info = await Info.findOne({ user: userId });

    if (info) {
      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          info[field] = data[field];
        }
      });
      await info.save();
    } else {
      info = await Info.create({
        user: userId,
        ...allowedFields.reduce((acc, field) => {
          if (data[field] !== undefined) {
            acc[field] = data[field];
          }
          return acc;
        }, {}),
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

    if (infos.length === 0) {
      throw new ApiError.NotFoundError("Информация о пользователях не найдена");
    }

    return infos.map((info) => new FullInfoDto(info));
  }

  async getAllUsers(filterOptions, sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw new ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, 50);

    const filter = {};
    const searchRegex = new RegExp(searchQuery, "i");

    if (filterOptions.role) {
      filter["user.role"] = filterOptions.role;
    }

    if (searchQuery) {
      filter.$or = [
        { "user.login": searchRegex },
        { "user.email": searchRegex },
        { surname: searchRegex },
        { firstname: searchRegex },
        { contact: searchRegex },
      ];
    }

    const sort = {};
    if (sortOptions.createdAt) {
      sort.createdAt = sortOptions.createdAt === "asc" ? 1 : -1;
    }
    if (sortOptions.role) {
      sort["user.role"] = sortOptions.role === "asc" ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const infos = await Info.find(filter)
      .populate("user", "-hash")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    if (infos.length === 0) {
      throw new ApiError.NotFoundError("Информация о пользователях не найдена");
    }

    const total = await Info.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      data: infos.map((info) => new FullInfoDto(info)),
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
