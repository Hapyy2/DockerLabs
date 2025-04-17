const express = require("express");
const redis = require("redis");
const { Pool } = require("pg");
const { promisify } = require("util");

const app = express();
app.use(express.json());

const redisClient = redis.createClient({
  host: "redis",
  port: 6379,
});

redisClient.on("error", (err) => {
  console.error("Błąd Redis:", err);
});

const lpushAsync = promisify(redisClient.lpush).bind(redisClient);
const lrangeAsync = promisify(redisClient.lrange).bind(redisClient);

const pgPool = new Pool({
  user: process.env.POSTGRES_USER || "admin",
  host: "postgres",
  database: process.env.POSTGRES_DB || "usersdb",
  password: process.env.POSTGRES_PASSWORD || "secret123",
  port: 5432,
});

const connectWithRetry = async () => {
  let retries = 5;
  while (retries) {
    try {
      await pgPool.query("SELECT NOW()");
      console.log("Połączenie z PostgreSQL ustanowione");
      return true;
    } catch (err) {
      console.error("Błąd połączenia z PostgreSQL:", err);
      retries -= 1;
      console.log(`Pozostało prób: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  return false;
};

const initializeDatabase = async () => {
  try {
    console.log("Inicjalizacja bazy danych...");
    const connected = await connectWithRetry();
    if (!connected) {
      console.error("Nie można połączyć się z bazą danych po kilku próbach");
      return;
    }

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabela użytkowników zainicjalizowana pomyślnie");
  } catch (error) {
    console.error("Błąd podczas inicjalizacji bazy danych:", error);
  }
};

app.get("/", (req, res) => {
  res.send(`
    <h1>API do zarządzania wiadomościami i użytkownikami</h1>
    <p>Dostępne endpointy:</p>
    <ul>
      <li>POST /messages - dodaj nową wiadomość</li>
      <li>GET /messages - pobierz wszystkie wiadomości</li>
      <li>POST /users - dodaj nowego użytkownika</li>
      <li>GET /users - pobierz wszystkich użytkowników</li>
    </ul>
  `);
});

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

app.post("/users", async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json({ error: "Brak wymaganych danych użytkownika" });
    }

    console.log(`Próba dodania użytkownika: ${username}, ${email}`);

    const result = await pgPool.query(
      "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING id, username, email, created_at",
      [username, email]
    );

    console.log("Użytkownik dodany pomyślnie:", result.rows[0]);

    res.status(201).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Błąd podczas dodawania użytkownika:", error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Użytkownik o podanej nazwie lub emailu już istnieje" });
    }

    res.status(500).json({
      error: "Błąd serwera",
      details: error.message,
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pgPool.query(
      "SELECT id, username, email, created_at FROM users ORDER BY id"
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Błąd podczas pobierania użytkowników:", error);
    res.status(500).json({ error: "Błąd serwera", details: error.message });
  }
});

app.get("/health", async (req, res) => {
  try {
    await pgPool.query("SELECT NOW()");
    res.status(200).json({
      status: "ok",
      services: {
        app: "running",
        postgres: "connected",
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      services: {
        app: "running",
        postgres: error.message,
      },
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  initializeDatabase();
});
