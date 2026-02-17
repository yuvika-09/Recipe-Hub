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
    target: "http://localhost:5001",
    changeOrigin: true,
  })
);

/* ---------- RECIPES ---------- */
app.use(
  "/recipes",
  createProxyMiddleware({
    target: "http://localhost:5002/recipes",
    changeOrigin: true
  })
);


/* ---------- COMMENTS ---------- */
app.use("/comments",
  createProxyMiddleware({
    target: "http://localhost:5003",
    changeOrigin: true,
  })
);

app.listen(process.env.GATEWAY_PORT, () => {
  console.log("API Gateway running");
});
