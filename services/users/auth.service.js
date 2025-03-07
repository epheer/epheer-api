const { User } = require("../../models");
const bcrypt = require("bcryptjs");
const TokenService = require("./token.service");
const UserDto = require("../../dtos/users/user.dto");
const ApiError = require("../../exceptions/api-error");

class AuthService {
  async #findUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw ApiError.NotFoundError("Пользователь не найден");
    }
    return user;
  }

  async registration(login, password, role, email) {
    const candidate = await User.findOne({ login });
    if (candidate) {
      throw ApiError.BadRequest(
        `Пользователь с логином ${login} уже существует`
      );
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ login, hash, role, email });
    const userDto = new UserDto(user);
    return { user: userDto };
  }

  async login(login, password) {
    const user = await User.findOne({ login });
    if (!user) {
      throw ApiError.BadRequest("Неверный логин или пароль");
    }
    const isPassEquals = await bcrypt.compare(password, user.hash);
    if (!isPassEquals) {
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
    const user = await this.#findUserById(userData.id);
    const userDto = new UserDto(user);
    const tokens = TokenService.generateTokens({ ...userDto });

    await TokenService.saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
  }

  async deactivate(id) {
    const user = await this.#findUserById(id);
    user.is_active = false;
    await user.save();
    return { message: `Аккаунт пользователя ${id} деактивирован` };
  }

  async unblock(id) {
    const user = await this.#findUserById(id);
    user.is_active = true;
    await user.save();
    return { message: `Аккаунт пользователя ${id} разблокирован` };
  }

  async changePassword(id, password) {
    const user = await this.#findUserById(id);
    const hash = await bcrypt.hash(password, 10);
    user.hash = hash;
    await user.save();
    return { message: "Пароль успешно изменен" };
  }

  async changeEmail(id, email) {
    const user = await this.#findUserById(id);
    user.email = email;
    await user.save();
    return { message: "Email успешно изменен" };
  }
}

module.exports = new AuthService();
