const authService = require("../../services/users/auth.service");
const ApiError = require("../../exceptions/api-error");
const { HTTP_STATUS } = require("../../config/http-statuses");
const {
  registerSchema,
  loginSchema,
  passwordSchema,
  emailSchema,
} = require("../../validators/auth.validator");

class AuthController {
  #validateSchema(schema, data) {
    const { error } = schema.validate(data);
    if (error) {
      throw ApiError.BadRequest(error.details[0].message);
    }
  }

  #setRefreshTokenCookie(res, refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true, // Только для HTTPS
    });
  }

  async registration(req, res, next) {
    try {
      this.#validateSchema(registerSchema, req.body);

      const { login, password, role, email } = req.body;
      const userData = await authService.registration(
        login,
        password,
        role,
        email
      );
      return res.status(HTTP_STATUS.CREATED).json(userData);
    } catch (e) {
      next(e);
    }
  }

  async login(req, res, next) {
    try {
      this.#validateSchema(loginSchema, req.body);

      const { login, password } = req.body;
      const userData = await authService.login(login, password);
      this.#setRefreshTokenCookie(res, userData.refreshToken);
      return res.status(HTTP_STATUS.OK).json(userData);
    } catch (e) {
      next(e);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const token = await authService.logout(refreshToken);
      res.clearCookie("refreshToken");
      return res.status(HTTP_STATUS.OK).json(token);
    } catch (e) {
      next(e);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const userData = await authService.refresh(refreshToken);
      this.#setRefreshTokenCookie(res, userData.refreshToken);
      return res.status(HTTP_STATUS.OK).json(userData);
    } catch (e) {
      next(e);
    }
  }

  async deactivate(req, res, next) {
    try {
      const id = req.params.id;
      const { message } = await authService.deactivate(id);
      return res.status(HTTP_STATUS.OK).json(message);
    } catch (e) {
      next(e);
    }
  }

  async unblock(req, res, next) {
    try {
      const id = req.params.id;
      const { message } = await authService.unblock(id);
      return res.status(HTTP_STATUS.OK).json(message);
    } catch (e) {
      next(e);
    }
  }

  async changePassword(req, res, next) {
    try {
      this.#validateSchema(passwordSchema, req.body);

      const id = req.params.id;
      const { password } = req.body;
      const { message } = await authService.changePassword(id, password);
      return res.status(HTTP_STATUS.OK).json(message);
    } catch (e) {
      next(e);
    }
  }

  async changeEmail(req, res, next) {
    try {
      this.#validateSchema(emailSchema, req.body);

      const id = req.params.id;
      const { email } = req.body;
      const { message } = await authService.changeEmail(id, email);
      return res.status(HTTP_STATUS.OK).json(message);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new AuthController();
