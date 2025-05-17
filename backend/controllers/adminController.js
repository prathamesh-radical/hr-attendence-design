import db from "../db/db.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
export const getAdminProfile = (req, res) => {
    try {
        const admin_id = req.user.admin_id || req.user.adminId; // Ensure compatibility

        if (!admin_id) {
            return res.status(400).json({ error: "Admin ID is missing" });
        }

        db.query(
            "SELECT * FROM admins WHERE admin_id = ?", 
            [admin_id], 
            (err, results) => {
                if (err) {
                    console.error("Database Query Error:", err);
                    return res.status(500).json({ error: "Failed to fetch admin profile" });
                }

                if (results.length === 0) {
                    return res.status(404).json({ error: "Admin not found" });
                }

                res.json(results[0]); // Return a single admin object
            }
        );
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateAdminProfile = async (req, res) => {
    const adminId = req.user.admin_id || req.user.adminId;
    const { first_name, last_name, email, phone, company_name, country } = req.body;

    try {
        db.query("SELECT admin_id FROM admins WHERE email = ? AND admin_id != ?", [email, adminId], async (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Server error" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "Email is already in use" });
            }

            // Update profile with country field
            const updateQuery = `UPDATE admins SET first_name = ?, last_name = ?, email = ?, phone = ?, company_name = ?, country = ? WHERE admin_id = ?`;
            db.query(updateQuery, [first_name, last_name, email, phone, company_name, country, adminId], async (err) => {
                if (err) {
                    return res.status(500).json({ message: "Server error" });
                }
                res.json({ message: "Profile updated successfully" });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};




export const updatePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.user.admin_id || req.user.adminId;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "Both old and new passwords are required" });
    }

    try {
        // Fetch the current hashed password from the database
        db.query("SELECT password FROM admins WHERE admin_id = ?", [adminId], (err, results) => {
            if (err) {
                console.error("Error fetching password:", err);
                return res.status(500).json({ message: "Server error" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Admin not found" });
            }

            // Compare old password
            bcrypt.compare(oldPassword, results[0].password, (err, isMatch) => {
                if (err) {
                    console.error("Error comparing passwords:", err);
                    return res.status(500).json({ message: "Server error" });
                }

                if (!isMatch) {
                    return res.status(400).json({ message: "Old password is incorrect" });
                }

                // Hash new password
                bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                    if (err) {
                        console.error("Error hashing new password:", err);
                        return res.status(500).json({ message: "Server error" });
                    }

                    // Update password in DB
                    db.query("UPDATE admins SET password = ? WHERE admin_id = ?", [hashedPassword, adminId], (err) => {
                        if (err) {
                            console.error("Error updating password:", err);
                            return res.status(500).json({ message: "Server error" });
                        }

                        return res.json({ message: "Password updated successfully" });
                    });
                });
            });
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const verifyPassword = (req, res) => {
    const { password } = req.body;
    const adminId = req.user.admin_id || req.user.adminId;
  
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
  
    db.query(
      'SELECT password FROM admins WHERE admin_id = ? AND deleted = 0',
      [adminId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
  
        if (!results || results.length === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }
  
        bcrypt.compare(password, results[0].password, (err, isMatch) => {
          if (err) {
            console.error('Bcrypt error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
          }
  
          if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
          }
  
          return res.json({ success: true, message: 'Password verified' });
        });
      }
    );
  };
  
  export const deactivateAccount = (req, res) => {
    const adminId = req.user.admin_id || req.user.adminId;
  
    db.query(
      'UPDATE admins SET deleted = 1 WHERE admin_id = ? AND deleted = 0',
      [adminId],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
  
        if (results.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Admin not found' });
        }
  
        return res.json({ success: true, message: 'Account deactivated successfully' });
      }
    );
  };