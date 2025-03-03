const { User } = require("../../models");
const bcrypt = require("bcryptjs");
const TokenService = require("./token.service");
const UserDto = require("../../dtos/users/user.dto");
const ApiError = require("../../exceptions/api-error");

class AuthService {
  async registration(login, password, role, email) {
    const candidate = await User.findOne({ login });
    if (candidate) {
      throw ApiError.BadRequest(
        `Пользователь с логином ${login} уже существует`
      );
    }
    const hash = await bcrypt.hash(password, 3);

    const user = await User.create({ login, hash, role, email });
    const userDto = new UserDto(user);
    return { user: userDto };
  }

  async login(login, password) {
    const user = await User.findOne({ login });
    const isPassEquals = await bcrypt.compare(password, user.hash);
    if (!user || !isPassEquals) {
      throw ApiError.BadRequest("Неверный логин или пароль");
    }
    if (!user.is_active) {
      throw ApiError.BadRequest("Ваш аккаунт заблокирован");
    }
    const userDto = new UserDto(user);
    const tokens = TokenService.generateTokens({ ...userDto });

    await TokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async logout(refreshToken) {
    const token = await TokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = TokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await TokenService.findToken(refreshToken);
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    const user = await User.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = TokenService.generateTokens({ ...userDto });

    await TokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async deactivate(id) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.NotFoundError();
    }
    user.is_active = false;
    await user.save();
    return { message: `Аккаунт пользователя ${id} деактивирован` };
  }

  async unblock(id) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.NotFoundError("Пользователь не найден");
    }
    user.is_active = true;
    await user.save();
    return { message: `Аккаунт пользователя ${id} разблокирован` };
  }

  async changePassword(id, password) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.NotFoundError("Пользователь не найден");
    }
    const hash = await bcrypt.hash(password, 3);
    user.hash = hash;
    await user.save();
    return { message: "Пароль успешно изменен" };
  }

  async changeEmail(id, email) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.NotFoundError("Пользователь не найден");
    }
    user.email = email;
    await user.save();
    return { message: "Email успешно изменен" };
  }
}

module.exports = new AuthService();
