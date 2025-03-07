const mongoose = require("mongoose");
const { Royalty } = require("../../models");
const ApiError = require("../../exceptions/api-error");
const RoyaltyDto = require("../../dtos/finances/royalty.dto");

class RoyaltyService {
  async #runInTransaction(operation) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw ApiError.InternalServerError(error.message || "Ошибка транзакции");
    } finally {
      session.endSession();
    }
  }

  async #findRoyaltyByArtistId(artistId, session = null) {
    const royalty = await Royalty.findOne({ artist: artistId }).session(
      session
    );
    if (!royalty) {
      throw ApiError.NotFoundError("Роялти не найдены");
    }
    return royalty;
  }

  async updatePaymentInfo(artistId, details) {
    return await this.#runInTransaction(async (session) => {
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
      return royalty;
    });
  }

  async addIncome(artistId, amount, period) {
    return await this.#runInTransaction(async (session) => {
      let royalty = await this.#findRoyaltyByArtistId(artistId, session);

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
      return royalty;
    });
  }

  async payout(artistId, amount, receipt_key) {
    return await this.#runInTransaction(async (session) => {
      const royalty = await this.#findRoyaltyByArtistId(artistId, session);

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
      return royalty;
    });
  }

  async toggleBlock(artistId) {
    return await this.#runInTransaction(async (session) => {
      const royalty = await this.#findRoyaltyByArtistId(artistId, session);

      if (royalty.status === "blocked") {
        royalty.status = royalty.active_income > 0 ? "active" : "paid";
      } else {
        royalty.status = "blocked";
      }

      await royalty.save({ session });
      return royalty;
    });
  }

  async getArtistRoyalties(artistId) {
    try {
      const royalties = await Royalty.find({ artist: artistId });
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
        .populate("contract")
        .lean()
        .exec();

      return royalties.map((royalty) => new RoyaltyDto(royalty));
    } catch (error) {
      throw ApiError.InternalServerError(
        "Ошибка при получении активных роялти"
      );
    }
  }
}

module.exports = new RoyaltyService();
