const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const redis = require("redis");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const Recipe = require("./models/Recipe");
const RecipeRequest = require("./models/RecipeRequest");

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL_RECIPES);

const publisher = redis.createClient();
publisher.connect().catch(err =>
  console.error("Redis connect error:", err)
);

const Saved = mongoose.model("Saved", {
  userId: String,
  recipeId: String
});

const router = express.Router();

function buildRecipeResponse(recipeDoc) {
  const likedBy = Array.isArray(recipeDoc.likedBy) ? recipeDoc.likedBy : [];
  const ratings = Array.isArray(recipeDoc.ratings) ? recipeDoc.ratings : [];
  const ratingCount = ratings.length;
  const avgRating = ratingCount
    ? ratings.reduce((sum, r) => sum + Number(r.value || 0), 0) / ratingCount
    : 0;

  return {
    ...recipeDoc,
    likes: likedBy.length,
    ratingCount,
    avgRating: Number(avgRating.toFixed(1))
  };
}

async function sendNotification(user, message, type) {
  if (!user) return;

  await publisher.publish("notifications", JSON.stringify({
    user,
    message,
    type
  }));
}

async function cleanupExpiredScheduledDeletions() {
  await Recipe.deleteMany({
    isDeletionScheduled: true,
    deletionScheduledFor: { $lte: new Date() }
  });
}


router.post("/", async (req, res) => {
  const request = await RecipeRequest.create({
    type: "CREATE",
    requestedBy: req.body.createdBy,
    data: req.body,
    status: "PENDING"
  });

  await sendNotification(
    "admin",
    `New recipe added by ${req.body.createdBy}: ${req.body.name}`,
    "REQUEST_CREATED"
  );

  res.json({
    message: "Recipe sent for approval",
    request
  });
});

router.post("/requests/update", async (req, res) => {
  const request = await RecipeRequest.create({
    type: "UPDATE",
    recipeId: req.body.recipeId,
    requestedBy: req.body.requestedBy,
    data: req.body.data,
    status: "PENDING"
  });

  await sendNotification(
    "admin",
    `Update request submitted by ${req.body.requestedBy}`,
    "REQUEST_UPDATED"
  );

  res.json(request);
});

router.post("/requests/delete", async (req, res) => {
  const reason = String(req.body.reason || "").trim();

  if (!reason) {
    return res.status(400).send("Delete reason is required");
  }

  const deleteDelayHours = Number(process.env.DELETE_REQUEST_DELAY_HOURS || 24);
  const deleteScheduledFor = new Date(Date.now() + (Math.max(deleteDelayHours, 1) * 60 * 60 * 1000));

  const request = await RecipeRequest.create({
    type: "DELETE",
    recipeId: req.body.recipeId,
    requestedBy: req.body.requestedBy,
    deleteReason: reason,
    deleteScheduledFor,
    status: "PENDING"
  });

  await sendNotification(
    "admin",
    `Delete request submitted by ${req.body.requestedBy}`,
    "REQUEST_DELETED"
  );

  await sendNotification(
    req.body.requestedBy,
    `Delete request scheduled. Your recipe will be deleted in ${Math.max(deleteDelayHours, 1)} hour(s) unless reviewed sooner.`,
    "REQUEST_DELETE_SCHEDULED"
  );

  res.json(request);
});

router.get("/", async (req, res) => {
  await cleanupExpiredScheduledDeletions();

  const page = Number(req.query.page) || 1;
  const limit = 5;

  const recipes = await Recipe.find({
    status: "APPROVED"
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json(recipes.map(buildRecipeResponse));
});

router.get("/user/:username", async (req, res) => {
  await cleanupExpiredScheduledDeletions();

  const recipes = await Recipe.find({
    createdBy: req.params.username,
    status: "APPROVED"
  }).sort({ createdAt: -1 }).lean();

  res.json(recipes.map(buildRecipeResponse));
});

router.get("/requests/user/:username", async (req, res) => {
  const requests = await RecipeRequest.find({
    requestedBy: req.params.username
  }).sort({ createdAt: -1 });

  res.json(requests);
});

router.put("/requests/approve/:id", async (req, res) => {
  const request = await RecipeRequest.findById(req.params.id);

  if (!request)
    return res.status(404).send("Not found");

  let recipeName = request.data?.name || "recipe";

  if (request.type === "CREATE") {
    const created = await Recipe.create({
      ...request.data,
      status: "APPROVED"
    });

    request.recipeId = created._id;
    recipeName = created.name;
  }

  if (request.type === "UPDATE") {
    const updated = await Recipe.findByIdAndUpdate(
      request.recipeId,
      {
        ...request.data,
         status: "APPROVED",
        isDeletionScheduled: false,
        deletionScheduledFor: null,
        deletionReason: "",
        deletionScheduledBy: ""
      },
      { new: true }
    );

    recipeName = updated?.name || recipeName;
  }

  if (request.type === "DELETE") {
    const deleted = await Recipe.findByIdAndDelete(
      request.recipeId
    );

    recipeName = deleted?.name || recipeName;
  }

  request.status = "APPROVED";
  request.reviewedBy = "ADMIN";
  request.reviewedAt = new Date();

  await request.save();

  await sendNotification(
    request.requestedBy,
    `Your ${request.type.toLowerCase()} request for ${recipeName} was approved`,
    "REQUEST_APPROVED"
  );

  res.send("Approved");
});

router.put("/requests/reject/:id", async (req, res) => {
  const request = await RecipeRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).send("Not found");
  }

  if (!req.body.reason || !req.body.reason.trim()) {
    return res.status(400).send("Rejection reason is required");
  }

  request.status = "REJECTED";
  request.rejectionReason = req.body.reason;
  request.reviewedBy = "ADMIN";
  request.reviewedAt = new Date();

  await request.save();

  await sendNotification(
    request.requestedBy,
    `Your ${request.type.toLowerCase()} request was rejected. Reason: ${req.body.reason}`,
    "REQUEST_REJECTED"
  );

  res.send("Rejected");
});

router.put("/like/:id", async (req, res) => {
  const { username } = req.body;

  const recipe = await Recipe.findById(req.params.id);

  if (!recipe)
    return res.status(404).send("Recipe not found");

  const index = recipe.likedBy.indexOf(username);
  let action = "liked";

  if (index === -1) {
    recipe.likedBy.push(username);
  } else {
    recipe.likedBy.splice(index, 1);
    action = "unliked";
  }

  await recipe.save();

  if (action === "liked" && recipe.createdBy !== username) {
    await sendNotification(
      recipe.createdBy,
      `${username} liked your ${recipe.name}`,
      "RECIPE_LIKED"
    );
  }

  const mapped = buildRecipeResponse(recipe.toObject());

  res.json({
    likes: mapped.likes,
    avgRating: mapped.avgRating,
    ratingCount: mapped.ratingCount
  });
});

router.put("/rate/:id", async (req, res) => {
  const { username, rating } = req.body;

  const recipe = await Recipe.findById(req.params.id);

  if (!recipe)
    return res.status(404).send("Recipe not found");

  const existingIndex = recipe.ratings.findIndex(
    r => r.username === username
  );

  if (existingIndex !== -1 && Number(recipe.ratings[existingIndex].value) === Number(rating)) {
    recipe.ratings.splice(existingIndex, 1);
  } else if (existingIndex !== -1) {
    recipe.ratings[existingIndex].value = rating;
  } else {
    recipe.ratings.push({ username, value: rating });
  }

  await recipe.save();

  const mapped = buildRecipeResponse(recipe.toObject());

  res.json({
    avgRating: mapped.avgRating,
    ratingCount: mapped.ratingCount,
    ratings: recipe.ratings
  });
});

router.post("/save", async (req, res) => {
  await Saved.create(req.body);
  res.send("Recipe saved");
});

router.get("/recommend/:ingredients", async (req, res) => {
  const userIngredients = req.params.ingredients
    .toLowerCase()
    .split(",")
    .map(i => i.trim());

  const recipes = await Recipe.find({ status: "APPROVED" }).lean();

  const scored = recipes.map(r => {
    const rawIngredients =
      Array.isArray(r.ingredients)
        ? r.ingredients.join(",")
        : String(r.ingredients || "");

    const recipeIngredients = rawIngredients
      .toLowerCase()
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    let score = 0;

    userIngredients.forEach(i => {
      if (recipeIngredients.includes(i)) score++;
    });

    return {
      ...buildRecipeResponse(r),
      score
    };
  });

  scored.sort((a, b) => b.score - a.score);
  res.json(scored);
});



router.get("/admin/approved", async (_req, res) => {
  await cleanupExpiredScheduledDeletions();

  const recipes = await Recipe.find({ status: "APPROVED" })
    .sort({ createdAt: -1 })
    .lean();

  res.json(recipes.map(buildRecipeResponse));
});

router.put("/admin/schedule-delete/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).send("Recipe not found");
  }

  const reason = String(req.body.reason || "").trim();
  const hours = Number(req.body.hours || 24);

  if (!reason) {
    return res.status(400).send("Deletion reason is required");
  }

  if (hours <= 0) {
    return res.status(400).send("Timeline must be greater than 0 hours");
  }

  const scheduledFor = new Date(Date.now() + (hours * 60 * 60 * 1000));

  recipe.isDeletionScheduled = true;
  recipe.deletionScheduledFor = scheduledFor;
  recipe.deletionReason = reason;
  recipe.deletionScheduledBy = req.body.admin || "ADMIN";

  await recipe.save();

  await sendNotification(
    recipe.createdBy,
    `Admin scheduled deletion for recipe "${recipe.name}" in ${hours}h. Reason: ${reason}. You can request an update before deletion.`,
    "RECIPE_DELETE_SCHEDULED"
  );

  res.json({
    message: "Deletion scheduled",
    deletionScheduledFor: scheduledFor
  });
});

router.put("/admin/cancel-delete/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    return res.status(404).send("Recipe not found");
  }

  recipe.isDeletionScheduled = false;
  recipe.deletionScheduledFor = null;
  recipe.deletionReason = "";
  recipe.deletionScheduledBy = "";

  await recipe.save();

  await sendNotification(
    recipe.createdBy,
    `Deletion schedule was canceled for recipe "${recipe.name}".`,
    "RECIPE_DELETE_CANCELLED"
  );

  res.json({
    message: "Deletion schedule canceled"
  });
});

router.get("/stats/dashboard", async (_req, res) => {
  const [approvedRecipes, pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
    Recipe.countDocuments({ status: "APPROVED" }),
    RecipeRequest.countDocuments({ status: "PENDING" }),
    RecipeRequest.countDocuments({ status: "APPROVED" }),
    RecipeRequest.countDocuments({ status: "REJECTED" })
  ]);

  res.json({ approvedRecipes, pendingRequests, approvedRequests, rejectedRequests });
});

router.get("/requests/:status", async (req, res) => {
  const status = req.params.status.toUpperCase();

  const requests = await RecipeRequest.find({
    status: { $regex: `^${status}$`, $options: "i" }
  }).sort({ createdAt: -1 });

  res.json(requests);
});

router.get("/:id", async (req, res) => {
  await cleanupExpiredScheduledDeletions();

  const recipe = await Recipe.findById(req.params.id).lean();

  if (!recipe) {
    return res.status(404).send("Recipe not found");
  }

  res.json(buildRecipeResponse(recipe));
});

app.use("/recipes", router);

app.listen(process.env.RECIPE_PORT, () =>
  console.log("Recipe service running")
);
