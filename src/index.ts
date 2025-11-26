import "dotenv/config";
import express from "express";
import cors from "cors";
import { Pool } from "pg";

const app = express();
const port = process.env.PORT || 3000;

// CORS + JSON
app.use(cors());
app.use(express.json());

// Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Heroku-specific SSL config
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Simple health endpoint
app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error("DB health check failed:", err);
    res.status(500).json({ status: "error" });
  }
});

// Example placeholder API
app.get("/api/hangouts", async (_req, res) => {
  const result = await pool.query("SELECT id, title, starts_at FROM hangouts ORDER BY starts_at ASC");
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
