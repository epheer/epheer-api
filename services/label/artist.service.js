const { User, Artist } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const ArtistDto = require("../../dtos/label/artist.dto");

class ArtistService {
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
      return artist;
    }

    artist.stage_name = stageName;
    await artist.save();

    return artist.stage_name;
  }

  async linkManager(artistId, managerId) {
    const artist = await Artist.findById(artistId);
    if (!artist) {
      throw ApiError.NotFoundError("Артист не найден");
    }

    const manager = await User.findById(managerId);
    if (!manager) {
      throw ApiError.NotFoundError("Менеджер не найден");
    }

    if (manager.role !== "manager" && manager.role !== "root") {
      throw ApiError.BadRequest(
        "Указанный пользователь не является менеджером"
      );
    }

    artist.manager = managerId;
    await artist.save();

    return artist;
  }

  async getArtistsByIds(artistIds) {
    if (!Array.isArray(artistIds)) {
      throw ApiError.BadRequest("Неверный формат списка ID артистов");
    }

    if (artistIds.length === 0) {
      throw ApiError.BadRequest("Список ID артистов не может быть пустым");
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

    if (artists.length === 0) {
      throw ApiError.NotFoundError("Артисты не найдены");
    }

    const result = artists.map((artist) => new ArtistDto(artist));

    return result;
  }

  async getAllArtists(filterOptions, sortOptions, searchQuery, page, limit) {
    if (page < 1 || limit < 1) {
      throw ApiError.BadRequest("Неверные параметры пагинации");
    }

    limit = Math.min(limit, 50);

    const filter = {};
    const searchRegex = new RegExp(searchQuery, "i");

    if (filterOptions.managerId) {
      filter.manager = filterOptions.managerId;
    }

    if (searchQuery) {
      filter.$or = [
        { stage_name: searchRegex },
        { "user.info.surname": searchRegex },
        { "user.info.firstname": searchRegex },
      ];
    }

    const sort = {};
    if (sortOptions.stage_name) {
      sort.stage_name = sortOptions.stage_name === "asc" ? 1 : -1;
    }
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

    const skip = (page - 1) * limit;

    const artists = await Artist.find(filter)
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
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    if (artists.length === 0) {
      throw ApiError.NotFoundError("Артисты не найдены");
    }

    const total = await Artist.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      data: artists.map((artist) => new ArtistDto(artist)),
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
