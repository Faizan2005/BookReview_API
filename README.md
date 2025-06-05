# BookReview_API: A RESTful Book Review Platform

Welcome to the BookReview_API! This project provides a robust backend for managing books and user reviews, complete with user authentication, search capabilities, and CRUD operations for books and reviews.

---

## Getting Started

This project uses **Docker** and **Docker Compose** to provide a consistent and easy-to-set-up development environment. You don't need to install Node.js or PostgreSQL directly on your machine!

### Prerequisites

Before you begin, ensure you have the following installed on your system:

1.  **Git**: For cloning the repository.
2.  **Docker Desktop** (for Windows/macOS) or **Docker Engine & Docker Compose** (for Linux).

    * [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
    * Docker Compose is usually included with Docker Desktop. For Linux, follow the official Docker installation guides to get both Docker Engine and Compose.

### Project Setup

Follow these simple steps to get the API running on your local machine:

1.  **Clone the Repository:**
    Open your terminal or command prompt and clone the project:

    ```bash
    git clone https://github.com/Faizan2005/BookReview_API.git
    cd BookReview_API
    ```

2.  **Create Your Environment File (`.env`):**
    This file stores your sensitive configuration (like database credentials and JWT secret) and is **not committed to Git**.

    * Create a new file named `.env` in the root of your project directory:

        ```bash
        touch .env
        ```
    * Open `.env` in a text editor and paste the following content. You can change the values if you wish, but ensure they are consistent with your setup.

        ```
        # .env - Environment variables for the application
        DB_USER=littlefinger
        DB_PASSWORD=icecream
        DB_HOST=db
        DB_NAME=book_review_api
        DB_PORT=5432
        JWT_SECRET=vnvn&&*jbj&*(%(*%))84ofmo3gf        
        ```
        * **Important:** Ensure your `JWT_SECRET` is a long, random string for security. The example given above `vnvn&&*jbj&*(%(*%))84ofmo3gf` is a good starting point, but you can generate a more complex one if preferred.

3.  **Run the Services with Docker Compose:**
    This command will build your Node.js application's Docker image, pull the PostgreSQL image, set up the database, and start both services.

    ```bash
    docker-compose up --build
    ```

    * **Wait for it!** This might take a few minutes on the first run as Docker downloads images and builds your application.
    * Look for messages like:
        * ``api-1  | [Server] Listening on port 3000...``
        * ``api-1  | [Server] Visit http://localhost:3000``
        * ``api-1  | [Database] Connected to PostgreSQL! Current DB time: 2025-06-05T10:15:02.473Z``
        
    * Once these messages appear, your API is up and running on `http://localhost:3000`.

    **Troubleshooting Tip:** If you ever need to reset your database completely (e.g., if you changed the schema in `docker-entry-point-initdb.d/init.sql` and want it applied), run:
    ```bash
    docker-compose down -v # Stops containers and removes the database volume
    docker-compose up --build # Restarts and re-initializes the database
    ```

---

## How to Use the API

The API is accessible at `http://localhost:3000`. You'll use `curl` (command line) or tools like Postman/Insomnia to send requests.

### Authentication Flow

1.  **Sign Up**: Register a new user.
2.  **Login**: Authenticate and receive a JSON Web Token (JWT).
3.  **Use JWT**: For all authenticated endpoints, you must include the JWT in the `Authorization` header as a `Bearer` token.

### Example API Requests

#### 1. `POST /signup` – Register a New User

```bash
curl -X POST \
  http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "securepassword123"
      }' 
```
```bash
Expected Output:

{
  "message": "User registered.",
  "user": {
    "id": "a_uuid_for_the_user",
    "name": "Test User",
    "email": "testuser@example.com"
  }
}
```

#### 2. POST /login – Authenticate and Return a Token
Important: Copy the token value from the response. You'll need it for subsequent requests!

```bash
curl -X POST \
  http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
        "email": "testuser@example.com",
        "password": "securepassword123"
      }' 
```

```bash
Expected Output:

{
  "message": "Logged in successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhX3V1aWRfZm9yX3RoZV91c2VyIiwiaWF0IjoxN...YOUR_ACTUAL_JWT_TOKEN_HERE"
}
```

-> REPLACE YOUR_AUTH_TOKEN with this entire string in all authenticated requests below. <-

#### 3. POST /books – Add a New Book (Authenticated)
Important: Copy the bookID from the response for later use.

```bash
curl -X POST \
  http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
        "title": "The Hitchhiker\"s Guide to the Galaxy",
        "author": "Douglas Adams",
        "genre": "Science Fiction"
      }'
```

#### 4. GET /books – Get All Books 
Supports pagination (?page=X&limit=Y) and optional filters (?author=X&genre=Y).

```bash
# Get all books (default pagination)
curl -X GET \
  "http://localhost:3000/books" \

# Get books filtered by author (partial & case-insensitive)
curl -X GET \
  "http://localhost:3000/books?author=douglas adams" \
```

#### 5. GET /books/:id – Get Book Details by ID 
Replace YOUR_BOOK_ID with an actual book ID.

```bash
curl -X GET \
  "http://localhost:3000/books/YOUR_BOOK_ID" \
```

#### 6. POST /books/:id/reviews – Submit a Review (Authenticated)
Important: Copy the review_id from the response.

```bash
curl -X POST \
  "http://localhost:3000/books/YOUR_BOOK_ID/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
        "rating": 5,
        "comment": "Absolutely brilliant and hilarious!"
      }'
```

#### 7. PUT /reviews/:id – Update Your Own Review (Authenticated)
Replace YOUR_REVIEW_ID with an actual review ID.

```bash
curl -X PUT \
  "http://localhost:3000/reviews/YOUR_REVIEW_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
        "rating": 4,
        "comment": "Still brilliant, but maybe a bit long in some parts."
      }' 
```

#### 8. DELETE /reviews/:id – Delete Your Own Review (Authenticated)
Replace YOUR_REVIEW_ID with an actual review ID.

```bash
curl -X DELETE \
  "http://localhost:3000/reviews/YOUR_REVIEW_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### 9. GET /search – Search Books by Title or Author (Unauthenticated)
This endpoint does NOT require an Authorization header.

#### Search by title (partial & case-insensitive)
```bash
curl -X GET "http://localhost:3000/search?title=guide" 
```

#### Search by both title and author
```bash
curl -X GET "http://localhost:3000/search?title=galaxy&author=adams"
```

## Design Decisions & Assumptions
#### Authentication: Implemented using JWT (JSON Web Tokens) for stateless authentication.

#### Database: PostgreSQL is used as the relational database.

#### Local Development Environment: Leverages Docker Compose to easily spin up both the Node.js API and a PostgreSQL database in isolated containers, ensuring a consistent setup across different machines.

#### Configuration: All sensitive or environment-specific configurations (like database credentials and JWT secret) are managed via environment variables loaded from a .env file, promoting security and portability.

## Database Schema
The API's database schema is defined as follows:

```bash
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, user_id)
);
```
