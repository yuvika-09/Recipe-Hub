const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

mongoose.connect(process.env.MONGO_URL_COMMENTS);

const Comment = mongoose.model("Comment", {
  recipeId: String,
  username: String,
  text: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

app.post("/comments", async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) {
    return res.status(400).send("Comment text is required");
  }

  const c = await Comment.create({
    recipeId: req.body.recipeId,
    username: req.body.username,
    text,
    parentId: req.body.parentId || null
  });

  res.json(c);
});

app.get("/comments/:recipeId", async (req, res) => {
  const data = await Comment.find({
    recipeId: req.params.recipeId
  }).sort({ createdAt: 1 });

  res.json(data);
});

app.listen(process.env.COMMENT_PORT, () => console.log("Comment service running"));