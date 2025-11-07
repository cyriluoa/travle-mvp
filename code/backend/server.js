import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`API on :${PORT}`));
