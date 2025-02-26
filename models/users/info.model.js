const mongoose = require("mongoose");

const InfoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  surname: {
    type: String,
    required: true,
    trim: true,
  },
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  patronymic: {
    type: String,
    trim: true,
  },
  contact: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("Info", InfoSchema, "info");
