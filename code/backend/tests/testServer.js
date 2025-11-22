import express from "express";
import authRoutes from "../routes/auth.js";
import randomTodayRouter from "../routes/randomToday.js"

export function makeTestServer() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/random-today", randomTodayRouter);
  return app;
}
