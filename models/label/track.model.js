const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema({
  release: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Release",
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
  },
  file: {
    key: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  feat: [
    {
      type: String,
    },
  ],
  authors: {
    lyricists: [
      {
        type: String,
      },
    ],
    producers: [
      {
        type: String,
      },
    ],
  },
  lyrics: {
    text: {
      type: String,
    },
    ttml_key: {
      type: String,
    },
  },
  explicit: {
    type: Boolean,
    default: false,
  },
  isrc: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("Track", TrackSchema);
