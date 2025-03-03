const { Info } = require("../../models");
const { InfoDto, FullInfoDto } = require("../../dtos/info.dto");
const ApiError = require("../../exceptions/api-error");

class InfoService {
  async updateInfo(userId, data) {
    const info = await Info.findOne({ user: userId });
    const allowedFields = ["surname", "firstname", "patronymic", "contact"];

    if (!info && (!data.surname || !data.firstname)) {
      throw new ApiError.BadRequest("Отстутствуют обязательные поля");
    }

    const updateFields = (target, source) => {
      allowedFields.forEach((field) => {
        if (source[field] !== undefined) {
          target[field] = source[field];
        }
      });
    };

    if (info) {
      updateFields(info, data);
      await info.save();

      return new InfoDto(info).toJSON();
    } else {
      const newInfo = await Info.create({
        user: userId,
        ...allowedFields.reduce((acc, field) => {
          if (data[field] !== undefined) {
            acc[field] = data[field];
          }
          return acc;
        }, {}),
      });

      return new InfoDto(newInfo).toJSON();
    }
  }

  async getUsersByIds(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new ApiError.BadRequest(
        "Неверный формат или пустой список ID пользователей"
      );
    }

    const infos = await Info.find({ user: { $in: userIds } })
      .populate("user", "login email role is_active createdAt")
      .exec();

    if (infos.length === 0) {
      throw new ApiError.NotFoundError("Информация о пользователях не найдена");
    }

    const result = infos.map((info) => new FullInfoDto(info));

    return result;
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

    const searchFields = [
      { "user.login": searchRegex },
      { "user.email": searchRegex },
      { surname: searchRegex },
      { firstname: searchRegex },
      { contact: searchRegex },
    ];
    if (searchQuery) {
      filter.$or = searchFields;
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
      .populate("user", "login email role is_active createdAt")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    if (infos.length === 0) {
      throw new ApiError.NotFoundError("Информация о пользователях не найдена");
    }

    const result = infos.map((info) => new FullInfoDto(info));

    const total = await Info.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      data: result,
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
