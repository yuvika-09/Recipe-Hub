const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

app.use(cors());

/* ---------- AUTH ---------- */
app.use("/auth",
  createProxyMiddleware({
    target: `http://localhost:${process.env.AUTH_PORT}`,
    changeOrigin: true,
  })
);

/* ---------- RECIPES ---------- */
app.use("/recipes",
  createProxyMiddleware({
    target: `http://localhost:${process.env.RECIPE_PORT}/recipes`,
    changeOrigin: true
  })
);


/* ---------- COMMENTS ---------- */
app.use("/comments",
  createProxyMiddleware({
    target: `http://localhost:${process.env.COMMENT_PORT}/comments`,
    changeOrigin: true,
  })
);

/* ---------- NOTIFICATIONS ---------- */
app.use("/notifications",
  createProxyMiddleware({
    target: `http://localhost:${process.env.NOTIFY_PORT}/notifications`,
    changeOrigin: true,
  })
);


app.listen(process.env.GATEWAY_PORT, () => {
  console.log("API Gateway running");
});
