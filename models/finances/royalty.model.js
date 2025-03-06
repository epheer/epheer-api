const mongoose = require("mongoose");
const { Schema } = mongoose;

const RoyaltyHistorySchema = new Schema({
  type: {
    type: String,
    enum: ["income", "payout"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  period: {
    type: String,
  },
  receipt_key: {
    type: String,
  },
});

const RoyaltySchema = new Schema({
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  details: {
    type: String,
  },
  active_income: {
    type: Number,
    default: 0,
  },
  total_income: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["active", "paid", "blocked"],
    default: "active",
  },
  history: [RoyaltyHistorySchema],
});

RoyaltySchema.virtual("contract", {
  ref: "Contract",
  localField: "artist",
  foreignField: "artist",
  justOne: true,
});

module.exports = mongoose.model("Royalty", RoyaltySchema, "royalties");
