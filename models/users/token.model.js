const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    refreshToken: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Token", TokenSchema);
