import db from "../db/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// admin signup
 // Assuming your database connection file is in config/db.js

export const signup = (req, res) => {
  const { first_name, last_name, email, phone, password, company_name, country } = req.body;

  if (!first_name || !last_name || !email || !phone || !password || !company_name || !country) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if email already exists
  db.query("SELECT email FROM admins WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });

    if (results.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: "Error hashing password" });

      // Insert new admin
      const sql = "INSERT INTO admins (first_name, last_name, email, phone, password, company_name, country) VALUES (?, ?, ?, ?, ?, ?, ?)";
      db.query(sql, [first_name, last_name, email, phone, hash, company_name, country], (err, result) => {
        if (err) return res.status(500).json({ message: "Signup failed", error: err.message });

        res.status(201).json({ message: "Admin registered successfully" });
      });
    });
  });
};




// Admin Login
export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Update SQL query to include the deleted column
  const sql = "SELECT admin_id, first_name, last_name, company_name, password, deleted FROM admins WHERE email = ?";
  
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.log("err", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const admin = results[0];

    // Check if account is deactivated
    if (admin.deleted === 1) {
      return res.status(403).json({ 
        message: "Account deactivated. Please contact support to reactivate."
      });
    }

    bcrypt.compare(password, admin.password, (err, isMatch) => {
      if (err) {
        console.log("err", err);
        return res.status(500).json({ message: "Error comparing passwords" });
      }

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { 
          adminId: admin.admin_id, 
          name: `${admin.first_name} ${admin.last_name}`,
          company: admin.company_name
        }, 
        process.env.JWT_SECRET, 
        // { expiresIn: "24h" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        adminId: admin.admin_id,
        name: `${admin.first_name} ${admin.last_name}`,
        company: admin.company_name,
      });
    });
  });
};