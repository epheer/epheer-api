const ApiError = require("../exceptions/api-error");
const { User, Release, Artist } = require("../models");

// Проверка доступа для root
const checkRootAccess = (role) => {
  if (role !== "root") {
    throw new Error("Доступ запрещен: ресурс доступен только управляющим.");
  }
};

// Проверка доступа для менеджера
const checkManagerAccess = async (id, role, req) => {
  if (role === "root") return;

  if (role !== "manager") {
    throw new Error("Доступ запрещен: ресурс доступен только менеджерам.");
  }

  const resourceOwnerIds = req.params.ids
    ? req.params.ids.split(",")
    : [req.params.id];

  if (!resourceOwnerIds.includes(id)) {
    throw new Error(
      "Доступ запрещен: вы не можете получить доступ к этому ресурсу."
    );
  }
};

// Проверка доступа для артиста
const checkArtistAccess = async (id, role, req) => {
  if (role === "root") return;

  if (role !== "artist") {
    throw new Error("Доступ запрещен: ресурс доступен только артистам.");
  }

  const resourceOwnerIds = req.params.ids
    ? req.params.ids.split(",")
    : [req.params.id];

  if (!resourceOwnerIds.includes(id)) {
    throw new Error(
      "Доступ запрещен: вы не можете получить доступ к этому ресурсу."
    );
  }
};

// Проверка доступа для лейбла
const checkLabelAccess = async (id, role, req) => {
  if (role === "root") return;

  if (!["artist", "manager"].includes(role)) {
    throw new Error(
      "Доступ запрещен: ресурс доступен только пользователям с лейбл-функциями."
    );
  }

  const resourceOwnerIds = req.params.ids
    ? req.params.ids.split(",")
    : [req.params.id];

  for (const resourceOwnerId of resourceOwnerIds) {
    const resourceOwner = await User.findById(resourceOwnerId).select("role");

    if (!resourceOwner) {
      const release = await Release.findById(resourceOwnerId).select("artist");
      if (!release) {
        throw new Error("Владелец ресурса не найден.");
      }
      const releaseOwnerId = release.artist.user_id;
      await checkArtistResourceAccess(id, role, releaseOwnerId);
    } else {
      const ownerRole = resourceOwner.role;
      switch (ownerRole) {
        case "artist":
          await checkArtistResourceAccess(id, role, resourceOwnerId);
          break;

        case "manager":
          await checkManagerResourceAccess(id, role, resourceOwnerId);
          break;

        default:
          throw new Error("Доступ запрещен: некорректный владелец ресурса.");
      }
    }
  }
};

// Проверка доступа к ресурсу артиста
const checkArtistResourceAccess = async (id, role, resourceOwnerId) => {
  if (role === "artist") {
    if (id !== resourceOwnerId) {
      throw new Error("Вы не можете получить доступ к другому артисту.");
    }
  } else if (role === "manager") {
    const artist = await Artist.findOne({ user: resourceOwnerId });
    if (!artist || artist.manager.toString() !== id) {
      throw new Error(
        "Ошибка доступа: вы не можете получить информацию по запрашиваемому артисту."
      );
    }
  }
};

// Проверка доступа к ресурсу менеджера
const checkManagerResourceAccess = async (id, role, resourceOwnerId) => {
  if (role === "manager") {
    if (id !== resourceOwnerId) {
      throw new Error("Вы не можете получить доступ к другому менеджеру.");
    }
  } else if (role === "artist") {
    const artist = await Artist.findOne({ user: id });
    if (!artist || artist.manager.toString() !== resourceOwnerId) {
      throw new Error(
        "Ошибка доступа: вы не можете получить информацию по запрашиваемому менеджеру."
      );
    }
  }
};

// Проверка персонального доступа
const checkPersonalAccess = (id, role, req) => {
  if (role === "root") return;

  const resourceOwnerIds = req.params.ids
    ? req.params.ids.split(",")
    : [req.params.id];

  if (!resourceOwnerIds.includes(id)) {
    throw new Error("Доступ запрещен: вы не имеете прав на этот ресурс.");
  }
};

// Основной middleware
const access = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { id, role } = req.user;

      switch (requiredRole) {
        case "root":
          checkRootAccess(role);
          break;
        case "manager":
          await checkManagerAccess(id, role, req);
          break;
        case "artist":
          await checkArtistAccess(id, role, req);
          break;
        case "label":
          await checkLabelAccess(id, role, req);
          break;
        case "personal":
          checkPersonalAccess(id, role, req);
          break;
        default:
          throw ApiError.BadRequest("Некорректный уровень доступа");
      }

      next();
    } catch (err) {
      next(ApiError.UnauthorizedError(err.message));
    }
  };
};

module.exports = access;
