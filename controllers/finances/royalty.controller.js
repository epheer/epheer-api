const royaltyService = require("../../services/finances/royalty.service");
const ApiError = require("../../exceptions/api-error");
const { HTTP_STATUS } = require("../../config/http-statuses");

class RoyaltyController {
  #extractParams(req) {
    const { id: artistId } = req.params;
    return { artistId };
  }

  #validateRequestBody(data, requiredFields = []) {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new ApiError.BadRequest(`Поле '${field}' обязательно`);
      }
    }

    if (data.amount && (isNaN(data.amount) || data.amount <= 0)) {
      throw new ApiError.BadRequest(
        "Поле 'amount' должно быть положительным числом"
      );
    }
  }

  async updatePaymentInfo(req, res, next) {
    try {
      const { artistId } = this.#extractParams(req);
      const { details } = req.body;

      this.#validateRequestBody({ details }, ["details"]);

      const royalty = await royaltyService.updatePaymentInfo(artistId, details);
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async addIncome(req, res, next) {
    try {
      const { artistId } = this.#extractParams(req);
      const { amount, period } = req.body;

      this.#validateRequestBody({ amount, period }, ["amount", "period"]);

      const royalty = await royaltyService.addIncome(artistId, amount, period);
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async payout(req, res, next) {
    try {
      const { artistId } = this.#extractParams(req);
      const { amount, receipt_key } = req.body;

      this.#validateRequestBody({ amount, receipt_key }, [
        "amount",
        "receipt_key",
      ]);

      const royalty = await royaltyService.payout(
        artistId,
        amount,
        receipt_key
      );
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async toggleBlock(req, res, next) {
    try {
      const { artistId } = this.#extractParams(req);

      const royalty = await royaltyService.toggleBlock(artistId);
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async getArtistRoyalties(req, res, next) {
    try {
      const { artistId } = this.#extractParams(req);

      const royalties = await royaltyService.getArtistRoyalties(artistId);
      res.status(HTTP_STATUS.OK).json(royalties);
    } catch (error) {
      next(error);
    }
  }

  async getAllActiveRoyalties(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;

      if (isNaN(page) || page < 1) {
        throw new ApiError.BadRequest("Неверный номер страницы");
      }
      if (isNaN(limit) || limit < 1) {
        throw new ApiError.BadRequest("Неверный лимит записей");
      }

      const queryOptions = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const royalties = await royaltyService.getAllActiveRoyalties(
        queryOptions
      );
      res.status(HTTP_STATUS.OK).json(royalties);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoyaltyController();
