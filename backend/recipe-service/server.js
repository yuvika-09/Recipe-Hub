const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Recipe = require("./models/Recipe");
const RecipeRequest = require("./models/RecipeRequest");
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


// CREATE RECIPE REQUEST
router.post("/", async (req,res)=>{

  const request = await RecipeRequest.create({
    type: "CREATE",
    requestedBy: req.body.createdBy,
    data: req.body
  });

  res.json({
    message: "Recipe sent for approval",
    request
  });
});

// GET SINGLE RECIPE
router.get("/:id", async (req,res)=>{

  const recipe =
    await Recipe.findById(req.params.id);

  res.json(recipe);
});

// UPDATE REQUEST
router.post("/requests/update", async (req,res)=>{

  const request = await RecipeRequest.create({
    type: "UPDATE",
    recipeId: req.body.recipeId,
    requestedBy: req.body.requestedBy,
    data: req.body.data
  });

  res.json(request);
});


// DELETE REQUEST
router.post("/requests/delete", async (req,res)=>{

  const request = await RecipeRequest.create({
    type: "DELETE",
    recipeId: req.body.recipeId,
    requestedBy: req.body.requestedBy
  });

  res.json(request);
});

// GET APPROVED RECIPES
router.get("/", async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = 5;

    const recipes = await Recipe.find({})
        .skip((page - 1) * limit)
        .limit(limit);

    res.json(recipes);
});

// USER - GET MY REQUESTS
router.get("/requests/user/:username", async (req,res)=>{

  const requests = await RecipeRequest.find({
    requestedBy: req.params.username
  }).sort({ createdAt: -1 });

  res.json(requests);
});


// APPROVE REQUEST
router.put("/requests/approve/:id", async (req,res)=>{

  const request =
    await RecipeRequest.findById(req.params.id);

  if(!request) return res.status(404).send("Not found");

  // CREATE recipe
  if(request.type === "CREATE"){
    await Recipe.create(request.data);
  }

  // UPDATE recipe
  if(request.type === "UPDATE"){
    await Recipe.findByIdAndUpdate(
      request.recipeId,
      request.data
    );
  }

  // DELETE recipe
  if(request.type === "DELETE"){
    await Recipe.findByIdAndDelete(
      request.recipeId
    );
  }

  request.status = "APPROVED";
  request.reviewedBy = "ADMIN";
  request.reviewedAt = new Date();

  await request.save();

  res.send("Approved");
});

// REJECT REQUEST
router.put("/requests/reject/:id", async (req,res)=>{

  const request =
    await RecipeRequest.findById(req.params.id);

  request.status = "REJECTED";
  request.rejectionReason = req.body.reason;
  request.reviewedBy = "ADMIN";
  request.reviewedAt = new Date();

  await request.save();

  res.send("Rejected");
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
router.put("/rate/:id", async (req, res) => {

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

// ADMIN - GET REQUESTS BY STATUS
router.get("/requests/:status", async (req,res)=>{

  const status = req.params.status.toUpperCase();

  const requests = await RecipeRequest.find({
    status
  }).sort({ createdAt: -1 });

  res.json(requests);
});


app.use("/recipes", router);

app.listen(process.env.RECIPE_PORT, () =>
    console.log("Recipe service running")
);
