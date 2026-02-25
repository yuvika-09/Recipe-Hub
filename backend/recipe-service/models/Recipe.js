const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: String,
  ingredients: [String],
  steps: String,
  imageUrl: String,
  prepTime: Number,
  servings: Number,
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
  ],
  reportEntries: [{
    reportedBy: String,
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeletionScheduled: {
    type: Boolean,
    default: false
  },
  deletionScheduledFor: Date,
  deletionReason: String,
  deletionScheduledBy: String
}, { timestamps: true });

module.exports = mongoose.model("Recipe", recipeSchema);