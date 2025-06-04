const express = require("express");
const http = require("http");
const pool = require("./models/storage");
require("dotenv").config();

const app = express();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}...`);
  console.log(`[Server] Visit http://localhost:${PORT}`);
});

app.post("/books", (req, res) => {
  const userID = req.userId;
  const { title, author, genre } = req.body;

  try {
    pool.query(
      "INSERT INTO books (title, author, genre, created_by) VALUES ($1, $2, $3, $4)",
      [title, author, genre, userID]
    );

    console.log(`${title} added for user ${userID}.`);
    res.status(200).json({ message: `${title}` });
  } catch (err) {
    console.error(`Error adding ${title} for user ${userID}:`, err);
    res.status(500).json({ error: "Failed to add book." });
  }
});

app.get("/books", (req, res) => {});

app.get("/books/:author", (req, res) => {});

app.get("/books/:genre", (req, res) => {});

app.get("/books/:id", (req, res) => {});

app.post("/books/:id/reviews", (req, res) => {});

app.put("/reviews/:id", (req, res) => {});

app.delete("/reviews/:id", (req, res) => {});
