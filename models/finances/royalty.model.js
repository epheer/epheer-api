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
    required: true,
  },
  payout_date: {
    type: Date,
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
  date: {
    type: Date,
  },
  period: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "paid", "blocked"],
    default: "active",
  },
  history: [RoyaltyHistorySchema],
});

module.exports = mongoose.model("Royalty", RoyaltySchema, "royalties");
