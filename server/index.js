import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import pg from "pg";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
const { Pool } = pg;
const port = 80;
app.use(express.json());
import http from "http";
import mysql from "mysql";
import https from "https";

const pool = mysql.createConnection({
  host: "sgismysqldb.cbi406sse361.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "12345678",
  database: "sgisdb",
  port: "3306",
});

pool.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as ID " + pool.threadId);
});

app.use(
  cors({
    origin: true, // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const SECRET_KEY = "secret"; // Store in env for security

app.get("/", async (req, res) => {
  console.log("server working");
  return res.status(200).json({ message: "working" });
});
// Sign Up API
app.post("/signup", async (req, res) => {
  console.log("sign up called");
  const { email, password } = req.body;
  console.log(email, password);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashedPassword],
    (err, result) => {
      if (err) {
        console.error("Error executing query: " + err.stack);
        res.status(400).send("Error creating user");
        return;
      }
      res.status(201).send("User created successfully");
    }
  );
});

// Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  pool.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Login failed" });
      }
      if (result.length === 0) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
        expiresIn: "1h",
      });
      res.json({ token });
    }
  );
});

// Fix __dirname issue in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer storage setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/submit-homework", upload.single("file"), (req, res) => {
  const { email, student_name, subject, teacher, notes } = req.body;
  const file = req.file;

  if (!email || !student_name || !subject || !teacher || !file) {
    return res
      .status(400)
      .json({ error: "All required fields must be filled." });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    file.filename
  }`;

  pool.query(
    "INSERT INTO homework_submissions (email, student_name, subject, teacher, notes, file_name, file_size, file_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      email,
      student_name,
      subject,
      teacher,
      notes || null,
      file.originalname,
      (file.size / 1024).toFixed(2) + " KB",
      fileUrl,
    ],
    (err, result) => {
      if (err) {
        console.error("Error submitting homework:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.status(201).json({ message: "Homework submitted successfully!" });
    }
  );
});

app.get("/homework/:email", (req, res) => {
  const { email } = req.params;
  pool.query(
    "SELECT * FROM homework_submissions WHERE email = ? ORDER BY submitted_at DESC",
    [email],
    (err, result) => {
      if (err) {
        console.error("Error fetching submissions:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(result);
    }
  );
});

app.post("/complaints", (req, res) => {
  const { student_name, email, subject, description } = req.body;
  if (!student_name || !email || !subject || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }
  pool.query(
    "INSERT INTO complaints (student_name, email, subject, description) VALUES (?, ?, ?, ?)",
    [student_name, email, subject, description],
    (err, result) => {
      if (err) {
        console.error("Error submitting complaint:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.status(201).json(result);
    }
  );
});

app.get("/complaints/:email", (req, res) => {
  const { email } = req.params;
  pool.query(
    "SELECT * FROM complaints WHERE email = ? ORDER BY date DESC",
    [email],
    (err, result) => {
      if (err) {
        console.error("Error fetching complaints:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(result);
    }
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
