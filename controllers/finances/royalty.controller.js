const royaltyService = require("../../services/finances/royalty.service");
const ApiError = require("../../exceptions/api-error");
const { HTTP_STATUS } = require("../../config/http-statuses");

class RoyaltyController {
  async updatePaymentInfo(req, res, next) {
    try {
      const artistId = req.params.id;
      const { details } = req.body;

      if (!details) {
        throw new ApiError.BadRequest("Поле 'details' обязательно");
      }

      const royalty = await royaltyService.updatePaymentInfo(artistId, details);
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async addIncome(req, res, next) {
    try {
      const artistId = req.params.id;
      const { amount, period } = req.body;

      if (!amount || !period) {
        throw new ApiError.BadRequest("Поля 'amount' и 'period' обязательны");
      }

      const royalty = await royaltyService.addIncome(artistId, amount, period);
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async payout(req, res, next) {
    try {
      const artistId = req.params.id;
      const { amount, receipt_key } = req.body;

      if (!amount || !receipt_key) {
        throw new ApiError.BadRequest(
          "Поля 'amount' и 'receipt_key' обязательны"
        );
      }

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
      const artistId = req.params.id;

      const royalty = await royaltyService.toggleBlock(artistId);
      res.status(HTTP_STATUS.OK).json(royalty);
    } catch (error) {
      next(error);
    }
  }

  async getArtistRoyalties(req, res, next) {
    try {
      const artistId = req.params.id;

      const royalties = await royaltyService.getArtistRoyalties(artistId);
      res.status(HTTP_STATUS.OK).json(royalties);
    } catch (error) {
      next(error);
    }
  }

  async getAllActiveRoyalties(req, res, next) {
    try {
      const royalties = await royaltyService.getAllActiveRoyalties();
      res.status(HTTP_STATUS.OK).json(royalties);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoyaltyController();
