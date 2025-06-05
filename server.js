const express = require("express");
const http = require("http");
const pool = require("./models/storage");
require("dotenv").config();

const app = express();

const server = http.createServer(app);

// --- Database Connection Test and Log ---
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("[Database] Connection Test FAILED:", err.stack);
    // Consider exiting the process if database is critical and not connected
    // process.exit(1);
  } else {
    console.log(
      "[Database] Connected to PostgreSQL! Current DB time:",
      res.rows[0].now
    );
  }
});

pool.on("error", (err) => {
  console.error("[Database] Unexpected error on idle client", err);
  // It's often good practice to exit if the main database pool has a critical error
  // process.exit(-1);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}...`);
  console.log(`[Server] Visit http://localhost:${PORT}`);
});

app.post("/books", async (req, res) => {
  const userID = req.userId;
  const { title, author, genre } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, genre, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [title, author, genre, userID]
    );

    const bookID = result.rows[0].id;
    console.log(`${title} added by user ${userID}.`);
    res.status(201).json({ message: `${title} added`, bookID });
  } catch (err) {
    console.error(`Error adding ${title} by user ${userID}:`, err);
    res.status(500).json({ error: "Failed to add book." });
  }
});

app.get("/books", async (req, res) => {
  const userID = req.userId;
  const { author, genre, page, limit } = req.query;

  const offset = (page - 1) * limit;

  const filters = [];
  const values = [];

  if (author) {
    values.push(`%${author}%`);
    filters.push(`author ILIKE $${values.length}`);
  }

  if (genre) {
    values.push(`%${genre}%`);
    filters.push(`genre ILIKE $${values.length}`);
  }

  const completeFilter =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const result = await pool.query(
      `SELECT * FROM books ${completeFilter} ORDER BY created_at DESC LIMIT $${
        values.length - 1
      } OFFSET $${values.length}`,
      values
    );

    res.status(200).json({
      books: result.rows,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ error: "Failed to fetch books." });
  }
});

app.get("/books/:author", (req, res) => {});

app.get("/books/:genre", (req, res) => {});

app.get("/books/:id", (req, res) => {});

app.post("/books/:id/reviews", (req, res) => {});

app.put("/reviews/:id", (req, res) => {});

app.delete("/reviews/:id", (req, res) => {});
