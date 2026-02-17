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
    likedBy: [String],
    ratings: [
        {
            username: String,
            value: Number
        }
    ]

});

module.exports = mongoose.model("Recipe", recipeSchema);
