const mongoose = require("mongoose");
const { Schema } = mongoose;

const StatusSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      enum: ["draft", "pending", "approved", "delivered", "rejected"],
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

const HistorySchema = new Schema({
  editor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: StatusSchema,
    required: true,
  },
});

const CurrentStatusSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      enum: ["draft", "pending", "approved", "rejected"],
    },
    message: {
      type: String,
    },
    history: [HistorySchema],
  },
  { timestamps: true }
);

const ReleaseSchema = new Schema(
  {
    artist: {
      user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      stage_name: {
        type: String,
        required: true,
      },
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["single", "ep", "album"],
    },
    date: {
      type: Date,
      required: true,
    },
    cover_key: {
      type: String,
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
    status: {
      type: CurrentStatusSchema,
      required: true,
      default: {
        label: "draft",
        message: null,
        history: [],
      },
    },
    upc: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Release", ReleaseSchema);
