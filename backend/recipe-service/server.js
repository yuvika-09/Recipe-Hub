const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Recipe = require("./models/Recipe");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL_RECIPES);

const redis = require("redis");
const publisher = redis.createClient();
publisher.connect().catch(err =>
    console.error("Redis connect error:", err)
);

const Saved = mongoose.model("Saved", {
    userId: String,
    recipeId: String
});

const router = express.Router();


// CREATE RECIPE
router.post("/", async (req, res) => {
    const recipe = await Recipe.create(req.body);
    res.json(recipe);
});

// GET APPROVED RECIPES
router.get("/", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = 5;

    const recipes = await Recipe.find({ status: "APPROVED" })
        .skip((page - 1) * limit)
        .limit(limit);

    res.json(recipes);
});

// ADMIN APPROVE
router.put("/approve/:id", async (req, res) => {
    await Recipe.findByIdAndUpdate(req.params.id, {
        status: "APPROVED"
    });

    await publisher.publish(
        "recipe-approved",
        "Your recipe was approved!"
    );

    res.send("Approved");
});

// ADMIN FEEDBACK
router.put("/feedback/:id", async (req, res) => {
    await Recipe.findByIdAndUpdate(req.params.id, {
        status: "NEEDS_IMPROVEMENT",
        adminFeedback: req.body.feedback
    });

    res.send("Feedback sent");
});

// LIKE
router.put("/like/:id", async (req, res) => {

    const { username } = req.body;

    const recipe = await Recipe.findById(req.params.id);

    const index = recipe.likedBy.indexOf(username);

    if (index === -1) {
        // LIKE
        recipe.likedBy.push(username);
    } else {
        // UNLIKE
        recipe.likedBy.splice(index, 1);
    }

    await recipe.save();

    res.json({
        likes: recipe.likedBy.length
    });
});


// RATE
app.put("/recipes/rate/:id", async (req, res) => {

    const { username, rating } = req.body;

    const recipe = await Recipe.findById(req.params.id);

    const existing =
        recipe.ratings.find(r => r.username === username);

    if (existing) {
        // update rating
        existing.value = rating;
    } else {
        // add rating
        recipe.ratings.push({ username, value: rating });
    }

    await recipe.save();

    res.send("Rated");
});


// SAVE RECIPE
router.post("/save", async (req, res) => {
    await Saved.create(req.body);
    res.send("Recipe saved");
});

// RECOMMEND
router.get("/recommend/:ingredients", async (req, res) => {
    const userIngredients = req.params.ingredients.split(",");

    const recipes = await Recipe.find({
        status: "APPROVED"
    });

    const scored = recipes.map(r => {
        const rawIngredients = Array.isArray(r.ingredients)
            ? r.ingredients.join(",")
            : String(r.ingredients || "");

        const recipeIngredients =
            rawIngredients.toLowerCase()
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

        let score = 0;

        userIngredients.forEach(i => {
            if (recipeIngredients.includes(i)) score++;
        });

        return { ...r._doc, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json(scored);
});

// ADMIN - GET PENDING RECIPES
router.get("/pending", async (req, res) => {

    const recipes = await Recipe.find({
        status: "PENDING"
    });

    res.json(recipes);
});



app.use("/recipes", router);

app.listen(process.env.RECIPE_PORT, () =>
    console.log("Recipe service running")
);
