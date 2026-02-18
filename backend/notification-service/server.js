const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const redis = require("redis");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const Notification = require("./models/Notification");

const app = express();
app.use(cors());
app.use(express.json());

/* ======================
   MONGODB CONNECTION
====================== */
mongoose.connect(process.env.MONGO_URL_NOTIFICATIONS)
  .then(() => console.log("Mongo connected"))
  .catch(err => console.error(err));

/* ======================
   HTTP + SOCKET
====================== */
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

/* ======================
   SOCKET LOGIC
====================== */
io.on("connection", (socket) => {

  console.log("User connected");

  // user joins own room
  socket.on("join", (username) => {
    socket.join(username);
    console.log(`Joined room: ${username}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});


/* ======================
   REDIS SUBSCRIBER
====================== */
const subscriber = redis.createClient();

subscriber.on("error", (err) => {
  console.error("Redis error:", err);
});

(async () => {
  await subscriber.connect();

  await subscriber.subscribe("notifications", async (msg) => {

    try {

      const data = JSON.parse(msg);

      // SAVE IN DB
      const saved =
        await Notification.create(data);

      // EMIT TO ONLY THAT USER
      io.to(data.user)
        .emit("notification", saved);

    } catch (err) {
      console.error("Notification error:", err);
    }

  });

})();


/* ======================
   APIs
====================== */

/* GET USER NOTIFICATIONS */
app.get("/notifications/:user", async (req, res) => {

  try {

    const data = await Notification.find({
      user: req.params.user,
    }).sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json(err);
  }
});


/* MARK ONE AS READ */
app.put("/notifications/read/:id", async (req, res) => {

  try {

    await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true }
    );

    res.send("Marked as read");

  } catch (err) {
    res.status(500).json(err);
  }
});


/* MARK ALL AS READ */
app.put("/notifications/read-all/:user", async (req, res) => {

  try {

    await Notification.updateMany(
      { user: req.params.user },
      { read: true }
    );

    res.send("All marked as read");

  } catch (err) {
    res.status(500).json(err);
  }
});


/* ======================
   START SERVER
====================== */
server.listen(process.env.NOTIFY_PORT, () => {
  console.log("Notification service running");
});
