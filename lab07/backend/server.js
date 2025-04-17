const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:80",
    methods: "GET",
    allowedHeaders: "Content-Type",
  })
);

const dbURI = "mongodb://database:27017"; // lub zmienna środowiskowa z .env
const dbName = "mydb";

let db;

MongoClient.connect(dbURI)
  .then((client) => {
    console.log("Connected to MongoDB");
    db = client.db(dbName);
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.get("/", (req, res) => {
  db.collection("test").findOne({}, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data");
      return;
    }
    res.send(
      result
        ? `Hello from backend! Data: ${JSON.stringify(result)}`
        : "No data found."
    );
  });
});

app.listen(3000, () => {
  console.log("Backend is running on port 3000");
});
