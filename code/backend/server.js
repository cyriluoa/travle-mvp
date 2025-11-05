import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 5000, () =>
  console.log(`API on :${process.env.PORT || 5000}`)
);
