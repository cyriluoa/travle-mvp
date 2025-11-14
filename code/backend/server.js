import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import cors from "cors";
import randomToday from "./routes/randomToday.js";
import reachable from "./routes/reachable.js";
import scoreRoutes from "./routes/score.js";
import gameHistoryRouter from "./routes/gameHistory.js"


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/random-today", randomToday);
app.use("/api/reachable", reachable);
app.use("/api/score", scoreRoutes);
app.use("/api/game", gameHistoryRouter);

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`API on :${PORT}`));
