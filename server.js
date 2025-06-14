const express = require("express");
const http = require("http");
const pool = require("./models/storage");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("[Database] Connection Test FAILED:", err.stack);
  } else {
    console.log(
      "[Database] Connected to PostgreSQL! Current DB time:",
      res.rows[0].now
    );
  }
});

// Handle idle DB client errors
pool.on("error", (err) => {
  console.error("[Database] Unexpected error on idle client", err);
});

// Middleware for JSON parsing and cookie handling
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

// Start HTTP server
server.listen(PORT, () => {
  console.log(`[Server] Listening on port ${PORT}...`);
  console.log(`[Server] Visit http://localhost:${PORT}`);
});

// User signup route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const checkExistingUser = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );
    if (checkExistingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email`,
      [name, email, passwordHash]
    );

    res
      .status(201)
      .json({ message: "User registered.", user: newUser.rows[0] });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed." });
  }
});

// User login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const validationResult = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );
    const validateUser = validationResult.rows[0];
    if (!validateUser) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, validateUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: validateUser.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Send token in HTTP-only cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
    });

    res.status(200).json({ message: "Logged in successfully.", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("Invalid or expired token:", err);
    return res.status(403).json({ error: "Token is invalid or expired" });
  }
}

// Add a new book (authenticated route)
app.post("/books", authenticateToken, async (req, res) => {
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

// Fetch books with optional filters and pagination
app.get("/books", async (req, res) => {
  const { author, genre, page = 1, limit = 10 } = req.query;
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

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  values.push(limit, offset);
  const limitParam = values.length - 1;
  const offsetParam = values.length;

  try {
    const result = await pool.query(
      `SELECT * FROM books 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
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

// Get single book by ID along with average rating and reviews
app.get("/books/:id", async (req, res) => {
  const bookID = req.params.id;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const bookResult = await pool.query(`SELECT * FROM books WHERE id=$1`, [
      bookID,
    ]);

    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    const book = bookResult.rows[0];

    const ratingResult = await pool.query(
      `SELECT AVG(rating)::numeric(2,1) AS avg_rating FROM reviews WHERE book_id = $1`,
      [bookID]
    );
    const avgRating = ratingResult.rows[0].avg_rating || 0;

    const reviewResult = await pool.query(
      `SELECT user_id, rating, comment FROM reviews WHERE book_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [bookID, limit, offset]
    );

    res.status(200).json({
      book,
      average_rating: avgRating,
      reviews: reviewResult.rows,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error("Error fetching book details:", err);
    res.status(500).json({ error: "Failed to fetch book details." });
  }
});

// Submit a new review for a book (authenticated route)
app.post("/books/:id/reviews", authenticateToken, async (req, res) => {
  const userID = req.userId;
  const bookID = req.params.id;
  const { rating, comment } = req.body;

  try {
    const existingReview = await pool.query(
      `SELECT id FROM reviews WHERE user_id = $1 AND book_id = $2`,
      [userID, bookID]
    );

    if (existingReview.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this book." });
    }

    const reviewResult = await pool.query(
      `INSERT INTO reviews (user_id, book_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userID, bookID, rating, comment]
    );

    const reviewID = reviewResult.rows[0].id;

    res.status(201).json({
      message: "Review added successfully.",
      review_id: reviewID,
    });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// Update an existing review (authenticated route)
app.put("/reviews/:id", authenticateToken, async (req, res) => {
  const reviewID = req.params.id;
  const userID = req.userId;
  const { rating, comment } = req.body;

  try {
    const checkResult = await pool.query(
      `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`,
      [reviewID, userID]
    );

    if (checkResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "You can only update your own review." });
    }

    await pool.query(
      `UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3`,
      [rating, comment, reviewID]
    );

    res.status(200).json({ message: "Review updated successfully." });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Failed to update review." });
  }
});

// Delete a review (authenticated route)
app.delete("/reviews/:id", authenticateToken, async (req, res) => {
  const reviewID = req.params.id;
  const userID = req.userId;

  try {
    const checkResult = await pool.query(
      `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`,
      [reviewID, userID]
    );

    if (checkResult.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "You can only delete your own review." });
    }

    await pool.query(`DELETE FROM reviews WHERE id=$1`, [reviewID]);

    res.status(200).json({ message: "Review deleted successfully." });
  } catch (err) {
    console.error("Error delete review:", err);
    res.status(500).json({ error: "Failed to delete review." });
  }
});

// Search books by title and/or author
app.get("/search", async (req, res) => {
  const { title, author } = req.query;

  const filters = [];
  const values = [];

  if (title) {
    values.push(`%${title}%`);
    filters.push(`title ILIKE $${values.length}`);
  }

  if (author) {
    values.push(`%${author}%`);
    filters.push(`author ILIKE $${values.length}`);
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const queryText = `SELECT * FROM books ${whereClause} ORDER BY created_at DESC`;
    const { rows } = await pool.query(queryText, values);
    res.json(rows);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
