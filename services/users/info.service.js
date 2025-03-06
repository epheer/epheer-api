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
      filter["user.role"] = filterOptions.role;
    }

    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i");
      filter.$or = [
        { "user.login": searchRegex },
        { "user.email": searchRegex },
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
      sort.createdAt = sortOptions.createdAt === "asc" ? 1 : -1;
    }
    if (sortOptions.role) {
      sort["user.role"] = sortOptions.role === "asc" ? 1 : -1;
    }
    return sort;
  }

  async getAllUsers(filterOptions, sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw new ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, MAX_LIMIT);

    const filter = this.#buildFilter(filterOptions, searchQuery);
    const sort = this.#buildSort(sortOptions);
    const skip = (page - 1) * limit;

    const infos = await Info.find(filter)
      .populate("user", "-hash")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

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
