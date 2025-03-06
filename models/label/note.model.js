const mongoose = require("mongoose");
const { Schema } = mongoose;

const NoteSchema = new Schema({
  release_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Release",
    required: true,
    unique: true,
  },
  focus_tracks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
    },
  ],
  pitched: [
    {
      type: String,
    },
  ],
  comment: {
    type: String,
  },
});

module.exports = mongoose.model("Note", NoteSchema);
