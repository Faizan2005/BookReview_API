const { Pool } = require("pg");

const pool = new Pool({
  user: "littlefinger",
  password: "icecream",
  host: "localhost",
  port: 5432,
  database: "book_review_API",
});

module.exports = pool;



















