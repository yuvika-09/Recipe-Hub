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

const commentSchema = new mongoose.Schema({
  recipeId: String,
  username: String,
  text: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  reports: [{
    reportedBy: String,
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Comment = mongoose.model("Comment", commentSchema);

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

app.get("/comments/admin/reported", async (_req, res) => {
  const reportedComments = await Comment.find({
    "reports.0": { $exists: true }
  }).sort({ createdAt: -1 });

  res.json(reportedComments);
});

app.get("/comments/:recipeId", async (req, res) => {
  const data = await Comment.find({
    recipeId: req.params.recipeId
  }).sort({ createdAt: 1 });

  res.json(data);
});

app.post("/comments/:id/report", async (req, res) => {
  const reportedBy = String(req.body.reportedBy || "").trim();
  const reason = String(req.body.reason || "").trim();

  if (!reportedBy || !reason) {
    return res.status(400).send("Reporter and reason are required");
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).send("Comment not found");
  }

  const alreadyReported = comment.reports.some((entry) => entry.reportedBy === reportedBy);

  if (alreadyReported) {
    return res.status(400).send("You have already reported this comment");
  }

  comment.reports.push({ reportedBy, reason });
  await comment.save();

  res.json({ message: "Comment reported successfully" });
});

app.delete("/comments/:id", async (req, res) => {
  const requestedBy = String(req.body.requestedBy || "").trim();
  const role = String(req.body.role || "").trim().toUpperCase();

  if (!requestedBy) {
    return res.status(400).send("requestedBy is required");
  }

  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).send("Comment not found");
  }

  const canDelete = role === "ADMIN" || comment.username === requestedBy;

  if (!canDelete) {
    return res.status(403).send("Not allowed to delete this comment");
  }

  comment.text = "This comment has been deleted.";
  comment.isDeleted = true;
  comment.deletedAt = new Date();
  comment.reports = [];

  await comment.save();

  res.json({ message: "Comment deleted" });
});

app.patch("/comments/internal/anonymize-user/:username", async (req, res) => {
  const username = String(req.params.username || "").trim();

  if (!username || username === "admin") {
    return res.status(400).send("Invalid username");
  }

  await Comment.updateMany(
    { username },
    { $set: { username: "__DELETED_USER__" } }
  );

  res.json({ message: "Comments anonymized" });
});


app.listen(process.env.COMMENT_PORT, () => console.log("Comment service running"));