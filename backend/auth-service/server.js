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

/* ======================
   REGISTER
====================== */
app.post("/register", async (req, res) => {

  const hashed =
    await bcrypt.hash(req.body.password, 10);

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashed
  });

  await user.save();

  res.send("User Registered");
});


/* ======================
   LOGIN
====================== */
app.post("/login", async (req, res) => {

  const { email, password } = req.body;

  /* ADMIN LOGIN */
  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {

    const token = jwt.sign(
      { role: "ADMIN" },
      process.env.SECRET
    );

    return res.json({
      token,
      role: "ADMIN",
      username: "admin"
    });
  }

  /* USER LOGIN */
  const user = await User.findOne({ email });

  if (!user)
    return res.status(404).send("Not found");

  const valid =
    await bcrypt.compare(password, user.password);

  if (!valid)
    return res.status(401).send("Wrong password");

  const token = jwt.sign(
    {
      id: user._id,
      role: "USER",
      username: user.username
    },
    process.env.SECRET
  );

  res.json({
    token,
    role: "USER",
    username: user.username
  });
});

app.listen(process.env.AUTH_PORT, () =>
  console.log("Auth service running")
);
