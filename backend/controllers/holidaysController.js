import db from "../db/db.js";

export const addHolidays = (req, res) => {
    try {
        const { holidays } = req.body;
        const admin_id = req.user.admin_id || req.user.adminId;

        if (!admin_id) {
            return res.status(403).json({ message: "Unauthorized: Admin ID missing" });
        }

        if (!Array.isArray(holidays) || holidays.length === 0) {
            return res.status(400).json({ message: "Invalid input: Holidays must be a non-empty array" });
        }

        // Process holidays and group by month-year
        const values = holidays.map(({ date, reason }) => {
            const holidayDate = new Date(date);
            const month = holidayDate.getMonth() + 1; // Months are 0-based in JS
            const year = holidayDate.getFullYear();
            return [date, reason, month, year, admin_id];
        });

        // Insert or update grouped holidays
        const query = `
            INSERT INTO holidays (date, reason, month, year, admin_id)
            VALUES ?
            ON DUPLICATE KEY UPDATE reason = VALUES(reason);
        `;

        db.query(query, [values], (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ message: "Database error", error: err });
            }
            res.status(201).json({ message: "Holidays added successfully" });
        });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getHolidays = (req, res) => {
    const admin_id = req.user.admin_id || req.user.adminId;
    const { year, month } = req.query;

    // Validate year and month
    if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
    }

    const sql = `
        SELECT 
            id,
            CONVERT_TZ(date, '+00:00', '+05:30') AS date,  -- Convert UTC to IST
            reason, 
            month, 
            year 
        FROM holidays 
        WHERE admin_id = ? AND year = ? AND month = ?
        ORDER BY date ASC
    `;

    db.query(sql, [admin_id, year, month], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        // If no holidays found
        if (results.length === 0) {
            return res.json({ message: "No holidays found for the selected month", holidays: {} });
        }

        // Group holidays by month-year format
        const groupedHolidays = results.reduce((acc, holiday) => {
            const key = `${holiday.month}-${holiday.year}`;
            if (!acc[key]) acc[key] = [];

            acc[key].push({
                id: holiday.id, // Include id
                reason: holiday.reason,
                date: holiday.date ? new Date(holiday.date).toISOString().split('T')[0] : null // Handle possible string date
            });

            return acc;
        }, {});

        res.json({ holidays: groupedHolidays });
    });
};


export const removeHoliday = (req, res) => {

    const { holidayId } = req.body;

    if (!holidayId) {
        return res.status(400).json({ message: "Holiday ID is required" });
    }

    const query = `DELETE FROM holidays WHERE id = ?`;

    db.query(query, [holidayId], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Holiday not found" });
        }

        res.status(200).json({ message: "Holiday removed successfully" });
    });
};