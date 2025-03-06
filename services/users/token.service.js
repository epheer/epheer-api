const jwt = require("jsonwebtoken");
const { Token, User } = require("../../models/");

const ACCESS_TOKEN_LIFETIME = "15m";
const REFRESH_TOKEN_LIFETIME = "30d";

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_LIFETIME,
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_LIFETIME,
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  validateToken(token, secret) {
    try {
      const userData = jwt.verify(token, secret);
      return userData;
    } catch (e) {
      console.error("Ошибка валидации токена:", e.message);
      return null;
    }
  }

  validateAccessToken(token) {
    return this.validateToken(token, process.env.JWT_ACCESS_SECRET);
  }

  validateRefreshToken(token) {
    return this.validateToken(token, process.env.JWT_REFRESH_SECRET);
  }

  async saveToken(userId, refreshToken) {
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      throw new Error("Пользователь не найден");
    }

    const tokenData = await Token.findOne({ user: userId });
    if (tokenData) {
      tokenData.refreshToken = refreshToken;
      return tokenData.save();
    }
    const token = await Token.create({ user: userId, refreshToken });
    return token;
  }

  async removeToken(refreshToken) {
    const tokenData = await Token.deleteOne({ refreshToken });
    if (tokenData.deletedCount === 0) {
      throw new Error("Токен не найден");
    }
    return tokenData;
  }

  async findToken(refreshToken) {
    const tokenData = await Token.findOne({ refreshToken });
    return tokenData;
  }
}

module.exports = new TokenService();
