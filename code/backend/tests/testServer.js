import express from "express";
import authRoutes from "../routes/auth.js";

export function makeTestServer() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}
