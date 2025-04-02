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

const pool = mysql.createPool({
  host: "http://sgismysqldb.cbi406sse361.ap-south-1.rds.amazonaws.com",
  user: "admin",
  password: "12345678",
  database: "sgisdb",
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

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hashedPassword]
    );
    console.log(result);
    res.json({
      userId: result.rows[0].id,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log(email, password);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
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

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/**
 * @route POST /submit-homework
 * @desc Submit homework with file upload
 */
// app.post("/submit-homework", upload.single("file"), async (req, res) => {
//   try {
//     console.log("kjwbwefvikengvil");
//     const { email, student_name, subject, teacher, notes } = req.body;
//     const file = req.file;

//     console.log(email, student_name, subject, teacher, notes, file);

//     if (!email || !student_name || !subject || !teacher || !file) {
//       return res
//         .status(400)
//         .json({ error: "All required fields must be filled." });
//     }

//     const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
//       file.filename
//     }`;

//     const query = `
//       INSERT INTO homework_submissions
//       (email, student_name, subject, teacher, notes, file_name, file_size, file_url)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
//     `;
//     const values = [
//       email,
//       student_name,
//       subject,
//       teacher,
//       notes || null,
//       file.originalname,
//       (file.size / 1024).toFixed(2) + " KB",
//       fileUrl,
//     ];

//     const result = await pool.query(query, values);
//     res.status(201).json({
//       message: "Homework submitted successfully!",
//       submission: result.rows[0],
//     });
//   } catch (error) {
//     console.error("Error submitting homework:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/submit-homework", upload.single("file"), async (req, res) => {
  try {
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

    const query = `
      INSERT INTO homework_submissions 
      (email, student_name, subject, teacher, notes, file_name, file_size, file_url) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;

    const values = [
      email,
      student_name,
      subject,
      teacher,
      notes || null,
      file.originalname,
      (file.size / 1024).toFixed(2) + " KB",
      fileUrl,
    ];

    const result = await pool.query(query, values);
    res.status(201).json({
      message: "Homework submitted successfully!",
      submission: result.rows[0],
    });
  } catch (error) {
    console.error("Error submitting homework:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /homework/:email
 * @desc Fetch all submissions for a specific student
 */
app.get("/homework/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const query =
      "SELECT * FROM homework_submissions WHERE email = $1 ORDER BY submitted_at DESC";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No submissions found." });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/complaints", async (req, res) => {
  const { student_name, email, subject, description } = req.body;

  if (!student_name || !email || !subject || !description) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO complaints (student_name, email, subject, description) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [student_name, email, subject, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error submitting complaint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/complaints/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM complaints WHERE email = $1 ORDER BY date DESC",
      [email]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  // console.log(`Server running on http://3.108.237.75:80`);
});

// server.listen(port, "0.0.0.0", () => {
//   console.log(`Server running on http://0.0.0.0:${port}`);
// });
// http
//   .createServer(function (req, res) {
//     res.write("** Welcome to SGIS**"); //write a response to the client
//     res.end(); //end the response
//   })
//   .listen(80);

// https.createServer(options, app).listen(443, () => {
//   console.log("HTTPS Server running on port 443");
// });
