
const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    team: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Available", "Busy", "Offline"],
      default: "Offline",
    },
    location: {
      type: String,
      default: "Not specified",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", agentSchema);
