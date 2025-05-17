import db from '../db/db.js';

// Get existing timing
export const getOfficeTime = (req, res) => {
    const admin_id = req.user.admin_id || req.user.adminId;
    const query = "SELECT punch_in, punch_out FROM timing WHERE admin_id = ?";
    
    db.query(query, [admin_id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "No timing found" });
        }
        res.json(result[0]);
    });
};

// Function to convert time to 1-12 for AM and 13-00 for PM format
const convertTo24HourFormat = (time) => {
    const [hour, minutePart] = time.split(":");
    const minute = minutePart.slice(0, 2);
    const period = minutePart.slice(2).toUpperCase();

    let hourInt = parseInt(hour);

    if (period === "PM" && hourInt !== 12) {
        hourInt += 12;
    } else if (period === "AM" && hourInt === 12) {
        hourInt = 0;
    }

    return `${hourInt.toString().padStart(2, '0')}:${minute}`;
};

// Add or Update timing
export const addOfficeTime = (req, res) => {
    let { punch_in, punch_out } = req.body;
    const admin_id = req.user.admin_id || req.user.adminId;

    if (!punch_in || !punch_out) {
        return res.status(400).json({ message: "Punch In and Punch Out times are required" });
    }

    // Convert times to 24-hour format
    punch_in = convertTo24HourFormat(punch_in);
    punch_out = convertTo24HourFormat(punch_out);

    const checkQuery = "SELECT * FROM timing WHERE admin_id = ?";
    db.query(checkQuery, [admin_id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (result.length > 0) {
            // Update if exists
            const updateQuery = "UPDATE timing SET punch_in = ?, punch_out = ? WHERE admin_id = ?";
            db.query(updateQuery, [punch_in, punch_out, admin_id], (err) => {
                if (err) return res.status(500).json({ message: "Error updating timing" });
                return res.status(200).json({ message: "Timing updated successfully" });
            });
        } else {
            // Insert if not exists
            const insertQuery = "INSERT INTO timing (admin_id, punch_in, punch_out) VALUES (?, ?, ?)";
            db.query(insertQuery, [admin_id, punch_in, punch_out], (err) => {
                if (err) return res.status(500).json({ message: "Error adding timing" });
                return res.status(201).json({ message: "Timing added successfully" });
            });
        }
    });
};
