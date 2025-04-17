const express = require("express");
const redis = require("redis");
const { promisify } = require("util");

const app = express();
app.use(express.json());

const client = redis.createClient({
  host: "redis",
  port: 6379,
});

client.on("error", (err) => {
  console.error("Błąd Redis:", err);
});

const lpushAsync = promisify(client.lpush).bind(client);
const lrangeAsync = promisify(client.lrange).bind(client);

app.post("/messages", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Brak wiadomości w żądaniu" });
    }

    await lpushAsync("messages", message);
    res.status(201).json({ success: true, message: "Wiadomość zapisana" });
  } catch (error) {
    console.error("Błąd podczas zapisywania wiadomości:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await lrangeAsync("messages", 0, -1);
    res.json({ messages });
  } catch (error) {
    console.error("Błąd podczas pobierania wiadomości:", error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h1>API do zarządzania wiadomościami</h1>
    <p>Dostępne endpointy:</p>
    <ul>
      <li>POST /messages - dodaj nową wiadomość</li>
      <li>GET /messages - pobierz wszystkie wiadomości</li>
    </ul>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});
