const mongoose = require("mongoose");
const { Schema } = mongoose;

const StatusSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      enum: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "delivered",
        "finalized",
      ],
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);

const CurrentStatusSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      enum: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "delivered",
        "finalized",
      ],
    },
    message: {
      type: String,
    },
    history: [
      {
        editor: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: StatusSchema,
          required: true,
        },
      },
    ],
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
    },
    type: {
      type: String,
      enum: ["single", "ep", "album"],
    },
    date: {
      type: Date,
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

ReleaseSchema.virtual("tracks", {
  ref: "Track",
  localField: "_id",
  foreignField: "release",
  justOne: false,
});

module.exports = mongoose.model("Release", ReleaseSchema);
