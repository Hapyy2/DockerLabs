const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

app.get("/api/data", (req, res) => {
  res.json({
    message: "Hello from mikroserwis_b!",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Mikroserwis_b listening at http://localhost:${port}`);
});
