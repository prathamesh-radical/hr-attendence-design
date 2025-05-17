import db from "../db/db.js";

// ✅ Add Weekends
export const addWeekends = (req, res) => {
    try {
        const { weekends } = req.body;
        const admin_id = req.user.admin_id || req.user.adminId;

        if (!admin_id) {
            return res.status(403).json({ message: "Unauthorized: Admin ID missing" }); 
        }

        if (!Array.isArray(weekends) || weekends.length === 0) {
            return res.status(400).json({ message: "Invalid input: Weekends must be a non-empty array" });
        }

        // Check for existing days
        const checkQuery = `SELECT day FROM weekends WHERE admin_id = ? AND day IN (?)`;
        db.query(checkQuery, [admin_id, weekends], (err, existingDays) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Database error", error: err });
            }

            const existingDaysArray = existingDays.map((item) => item.day);

            // Find days that are not already present
            const newDays = weekends.filter((day) => !existingDaysArray.includes(day));

            if (newDays.length === 0) {
                return res.status(400).json({ message: "All selected days already exist" });
            }

            const values = newDays.map((day) => [day, admin_id]);

            const insertQuery = `INSERT INTO weekends (day, admin_id) VALUES ?`;
            db.query(insertQuery, [values], (err, result) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ message: "Database error", error: err });
                }
                res.status(201).json({ 
                    message: "Weekends added successfully", 
                    insertedDays: newDays 
                });
            });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ Get Weekends
export const getWeekends = (req, res) => {
    const admin_id = req.user.admin_id || req.user.adminId;

    if (!admin_id) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    const query = "SELECT id, day FROM weekends WHERE admin_id = ?";
    db.query(query, [admin_id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json({ weekends: result });
    });
};

// ✅ Delete Weekend by ID
export const deleteWeekend = (req, res) => {
    const { id } = req.params;
    const admin_id = req.user.admin_id || req.user.adminId;

    if (!admin_id) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    if (!id) {
        return res.status(400).json({ message: "Weekend ID is required" });
    }

    const query = "DELETE FROM weekends WHERE id = ? AND admin_id = ?";
    db.query(query, [id, admin_id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Weekend not found or already deleted" });
        }

        res.json({ message: "Weekend removed successfully" });
    });
};
