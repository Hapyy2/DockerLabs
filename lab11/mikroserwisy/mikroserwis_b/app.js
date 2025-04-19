const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3000;

const mongoUsername = process.env.MONGO_USERNAME || "admin";
const mongoPassword = process.env.MONGO_PASSWORD || "password123";
const mongoHost = process.env.MONGO_HOST || "localhost";
const mongoPort = process.env.MONGO_PORT || "27017";
const dbName = process.env.DB_NAME || "appdb";

const mongoURI = `mongodb://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${dbName}?authSource=admin`;

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Połączono z MongoDB"))
  .catch((err) => console.error("Błąd połączenia z MongoDB:", err));

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "sprawny" });
});

// Pobieranie wszystkich wiadomości
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json({
      service: "mikroserwis_b",
      data: messages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Błąd bazy danych:", error);
    res.status(500).json({
      error: "Błąd bazy danych",
      message: error.message,
    });
  }
});

// Dodawanie nowej wiadomości
app.post("/messages", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Treść wiadomości jest wymagana" });
  }

  try {
    const newMessage = new Message({ content });
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Błąd bazy danych:", error);
    res.status(500).json({
      error: "Błąd bazy danych",
      message: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Mikroserwis_b nasłuchuje na http://localhost:${port}`);
});
