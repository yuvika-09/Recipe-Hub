const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});


mongoose.connect(process.env.MONGO_URL_COMMENTS);

const Comment = mongoose.model("Comment", {
  recipeId: String,
  username: String,
  text: String
});

app.post("/comments", async (req, res) => {
  const c = await Comment.create(req.body);
  res.json(c);
});

app.get("/comments/:recipeId", async (req, res) => {
  const data = await Comment.find({
    recipeId: req.params.recipeId
  });
  res.json(data);
});

app.listen(process.env.COMMENT_PORT, () => console.log("Comment service running"));
