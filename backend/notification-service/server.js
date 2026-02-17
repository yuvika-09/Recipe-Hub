const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const redis = require("redis");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* ---------- SOCKET CONNECTION ---------- */

io.on("connection", (socket) => {
  console.log("User connected");
});

/* ---------- REDIS ---------- */

const subscriber = redis.createClient();

subscriber.connect();

subscriber.subscribe("recipe-approved", (msg) => {
  io.emit("notification", msg);
});

/* ---------- START SERVER ---------- */

server.listen(process.env.NOTIFY_PORT, () => {
  console.log("Notification service running");
});
