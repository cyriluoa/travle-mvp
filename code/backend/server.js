import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`API on :${PORT}`));
