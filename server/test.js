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

  try {
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
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Error registering user" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  // console.log(`Server running on http://3.108.237.75:80`);
});
