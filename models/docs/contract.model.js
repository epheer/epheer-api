const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppendixSchema = new Schema({
  type: {
    type: String,
    enum: ["termination", "appendix"],
    required: true,
  },
  appendix_number: {
    type: String,
    required: true,
    unique: true,
  },
  pdf_key: {
    type: String,
  },
});

const ContractSchema = new Schema({
  contract_number: {
    type: String,
    required: true,
    unique: true,
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pdf_key: {
    type: String,
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
