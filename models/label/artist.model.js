const mongoose = require("mongoose");

const ArtistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  stage_name: {
    type: String,
    required: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Artist", ArtistSchema);
