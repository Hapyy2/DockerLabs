const express = require("express");
const axios = require("axios");
const app = express();
const port = 8080;

const MIKROSERWIS_B_URL =
  process.env.MIKROSERWIS_B_URL || "http://localhost:3000";

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    instance: process.env.HOSTNAME || "local",
  });
});

// Forward to mikroserwis_b to get messages
app.get("/api/messages", async (req, res) => {
  try {
    console.log(`Forwarding request to ${MIKROSERWIS_B_URL}/messages`);
    const response = await axios.get(`${MIKROSERWIS_B_URL}/messages`);
    res.json({
      service: "mikroserwis_a",
      instance: process.env.HOSTNAME || "local",
      forwarded_response: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error calling mikroserwis_b:", error.message);
    res.status(500).json({
      error: "Failed to connect to mikroserwis_b",
      details: error.message,
    });
  }
});

// Create a new message via mikroserwis_b
app.post("/api/messages", async (req, res) => {
  try {
    const response = await axios.post(
      `${MIKROSERWIS_B_URL}/messages`,
      req.body
    );
    res.status(201).json({
      service: "mikroserwis_a",
      instance: process.env.HOSTNAME || "local",
      created: response.data,
    });
  } catch (error) {
    console.error("Error calling mikroserwis_b:", error.message);
    res.status(500).json({
      error: "Failed to connect to mikroserwis_b",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Mikroserwis_a listening at http://localhost:${port}`);
});
