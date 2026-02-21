const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL_AUTH);

const User = mongoose.model("User", {
  username: String,
  email: String,
  password: String
});

app.post("/register", async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });

  if (existing) {
    return res.status(400).send("Email already exists");
  }

  const hashed = await bcrypt.hash(req.body.password, 10);

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashed
  });

  await user.save();

  res.send("User Registered");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { role: "ADMIN", username: "admin", email },
      process.env.SECRET
    );

    return res.json({
      token,
      role: "ADMIN",
      username: "admin",
      email
    });
  }

  const user = await User.findOne({ email });

  if (!user)
    return res.status(404).send("Not found");

  const valid = await bcrypt.compare(password, user.password);

  if (!valid)
    return res.status(401).send("Wrong password");

  const token = jwt.sign(
    {
      id: user._id,
      role: "USER",
      username: user.username,
      email: user.email
    },
    process.env.SECRET
  );

  res.json({
    token,
    id: user._id,
    role: "USER",
    username: user.username,
    email: user.email
  });
});

app.get("/users", async (_req, res) => {
  const users = await User.find({}, { password: 0 }).sort({ username: 1 });
  res.json(users);
});


app.get("/users/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username }, { password: 0 });

  if (!user) {
    return res.status(404).send("User not found");
  }

  res.json(user);
});

app.delete("/users/:username", async (req, res) => {
  if (req.params.username === "admin") {
    return res.status(400).send("Admin account cannot be deleted");
  }

  const deleted = await User.findOneAndDelete({ username: req.params.username });

  if (!deleted) {
    return res.status(404).send("User not found");
  }

  res.send("User deleted");
});

app.patch("/users/:username", async (req, res) => {
  const existing = await User.findOne({ username: req.params.username });

  if (!existing) {
    return res.status(404).send("User not found");
  }

  const nextUsername = req.body.username?.trim();
  const nextEmail = req.body.email?.trim();

  if (nextEmail && nextEmail !== existing.email) {
    const used = await User.findOne({ email: nextEmail });
    if (used) return res.status(400).send("Email already in use");
  }

  existing.username = nextUsername || existing.username;
  existing.email = nextEmail || existing.email;
  await existing.save();

  res.json({
    username: existing.username,
    email: existing.email
  });
});

app.patch("/users/:username/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findOne({ username: req.params.username });

  if (!user) {
    return res.status(404).send("User not found");
  }

  const valid = await bcrypt.compare(currentPassword, user.password);

  if (!valid) {
    return res.status(401).send("Current password is invalid");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.send("Password updated");
});

app.listen(process.env.AUTH_PORT, () =>
  console.log("Auth service running")
);