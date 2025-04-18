const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "appdb",
  user: process.env.DB_USER || "appuser",
  password: process.env.DB_PASSWORD || "password123",
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Get messages from database
app.get("/messages", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM messages");
    res.json({
      service: "mikroserwis_b",
      data: result.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

// Add a new message
app.post("/messages", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO messages (content) VALUES ($1) RETURNING *",
      [content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Database error",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Mikroserwis_b listening at http://localhost:${port}`);
});
