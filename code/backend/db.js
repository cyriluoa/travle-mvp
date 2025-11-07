// backend/db.js
import "dotenv/config";
import pg from "pg";

const cfg = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,               // must be a string
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

if (!cfg.password) throw new Error("Missing DB_PASSWORD");
const client = new pg.Client(cfg);
await client.connect();

export const query = (t, p) => client.query(t, p);

