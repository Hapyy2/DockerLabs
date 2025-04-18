const express = require("express");
const axios = require("axios");
const app = express();
const port = 8080;

const MICROSERVICE_B_URL = "http://mikroserwis-b-service:3000/api/data";

app.get("/forward", async (req, res) => {
  try {
    console.log("Forwarding request to mikroserwis_b...");
    const response = await axios.get(MICROSERVICE_B_URL);
    res.json({
      source: "mikroserwis_a",
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

app.listen(port, () => {
  console.log(`Mikroserwis_a listening at http://localhost:${port}`);
});
