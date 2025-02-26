const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppendixSchema = new Schema({
  type: {
    type: String,
    enum: ["termination", "appendix"],
    required: true,
  },
  pdf_key: {
    type: String,
    required: true,
  },
});

const ContractSchema = new Schema({
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pdf_key: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  appendices: [AppendixSchema],
  status: {
    type: String,
    enum: ["active", "terminated"],
    default: "active",
  },
});

module.exports = mongoose.model("Contract", ContractSchema);
