const mongoose = require("mongoose");

const RecipeRequestSchema = new mongoose.Schema({

  type: {
    type: String,
    enum: ["CREATE", "UPDATE", "DELETE"],
    required: true
  },

  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recipe",
    default: null
  },

  requestedBy: String,

  data: Object,

  deleteReason: String,

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },

  rejectionReason: String,

  reviewedBy: String,
  reviewedAt: Date

}, { timestamps: true });

module.exports = mongoose.model("RecipeRequest", RecipeRequestSchema);
