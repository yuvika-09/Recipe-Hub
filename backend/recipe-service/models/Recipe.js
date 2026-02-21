const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: String,
  ingredients: [String],
  steps: String,
  createdBy: String,
  status: {
    type: String,
    default: "PENDING"
  },
  adminFeedback: String,
  likedBy: {
    type: [String],
    default: []
  },
  ratings: [
    {
      username: String,
      value: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Recipe", recipeSchema);