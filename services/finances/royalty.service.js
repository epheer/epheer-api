const mongoose = require("mongoose");
const { Royalty } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const RoyaltyDto = require("../../dtos/finances/royalty.dto");

class RoyaltyService {
  async updatePaymentInfo(artistId, details) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let royalty = await Royalty.findOne({ artist: artistId }).session(
        session
      );

      if (!royalty) {
        royalty = new Royalty({
          artist: artistId,
          details,
          status: "paid",
        });
      } else {
        royalty.details = details;
      }

      await royalty.save({ session });
      await session.commitTransaction();
      return royalty;
    } catch (error) {
      await session.abortTransaction();
      throw ApiError.InternalServerError(
        "Ошибка при обновлении платежной информации"
      );
    } finally {
      session.endSession();
    }
  }

  async addIncome(artistId, amount, period) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let royalty = await Royalty.findOne({ artist: artistId }).session(
        session
      );

      if (!royalty) {
        throw ApiError.NotFoundError("Роялти не найдены");
      }

      royalty.status = "active";
      royalty.total_income += amount;
      royalty.active_income += amount;

      royalty.history.push({
        type: "income",
        amount,
        date: Date.now(),
        period,
      });

      await royalty.save({ session });
      await session.commitTransaction();
      return royalty;
    } catch (error) {
      await session.abortTransaction();
      throw ApiError.InternalServerError("Ошибка при добавлении поступления");
    } finally {
      session.endSession();
    }
  }

  async payout(artistId, amount, receipt_key) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const royalty = await Royalty.findOne({ artist: artistId }).session(
        session
      );

      if (!royalty) {
        throw ApiError.NotFoundError("Роялти не найдены");
      }

      if (royalty.status !== "active") {
        throw ApiError.BadRequest(
          "Выплата возможна только при активном статусе"
        );
      }

      royalty.active_income -= amount;

      if (royalty.active_income <= 0) {
        royalty.status = "paid";
      }

      royalty.history.push({
        type: "payout",
        amount,
        date: Date.now(),
        receipt_key,
      });

      await royalty.save({ session });
      await session.commitTransaction();
      return royalty;
    } catch (error) {
      await session.abortTransaction();
      throw ApiError.InternalServerError("Ошибка при выполнении выплаты");
    } finally {
      session.endSession();
    }
  }

  async toggleBlock(artistId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const royalty = await Royalty.findOne({ artist: artistId }).session(
        session
      );

      if (!royalty) {
        throw ApiError.NotFoundError("Роялти не найдены");
      }

      if (royalty.status === "blocked") {
        royalty.status = royalty.active_income > 0 ? "active" : "paid";
      } else {
        royalty.status = "blocked";
      }

      await royalty.save({ session });
      await session.commitTransaction();
      return royalty;
    } catch (error) {
      await session.abortTransaction();
      throw ApiError.InternalServerError("Ошибка при переключении блокировки");
    } finally {
      session.endSession();
    }
  }

  async getArtistRoyalties(artistId) {
    try {
      const royalties = await Royalty.find({ artist: artistId });
      if (!royalties || royalties.length === 0) {
        throw ApiError.NotFoundError("Роялти не найдены");
      }
      return royalties;
    } catch (error) {
      throw ApiError.InternalServerError("Ошибка при получении роялти артиста");
    }
  }

  async getAllActiveRoyalties() {
    try {
      const royalties = await Royalty.find({ status: "active" })
        .sort({ active_income: -1 })
        .populate({
          path: "artist",
          populate: {
            path: "info",
          },
        })
        .populate("contract");

      if (!royalties || royalties.length === 0) {
        throw new ApiError.NotFoundError("Активные роялти не найдены");
      }

      const result = royalties.map((royalty) => new RoyaltyDto(royalty));

      return result;
    } catch (error) {
      throw new ApiError.InternalServerError(
        "Ошибка при получении активных роялти"
      );
    }
  }
}

module.exports = new RoyaltyService();
