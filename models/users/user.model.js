const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    login: { type: String, required: true, unique: true, trim: true },
    hash: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: ["root", "manager", "artist"], required: true },
    is_active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
