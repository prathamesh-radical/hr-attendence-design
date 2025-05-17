// controllers/attendanceController.js
import db from "../db/db.js";

// Submit attendance for multiple employees
export const submitAttendance = (req, res) => {
  const { date, selectedEmployees } = req.body;

  if (!date || !selectedEmployees || Object.keys(selectedEmployees).length === 0) {
    return res.status(400).json({ message: 'Date and employee data are required' });
  }

  // Convert 12-hour format to 24-hour format for MySQL
  const convertTo24Hour = (time12h) => {
    if (!time12h) return null;
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (period === 'PM' && hours !== '12') hours = parseInt(hours, 10) + 12;
    if (period === 'AM' && hours === '12') hours = '00';
    
    return `${hours}:${minutes}:00`;
  };

  const values = [];
  const errors = [];

  // Process each employee's data
  for (const emp_id in selectedEmployees) {
    const { status, entryTime, exitTime } = selectedEmployees[emp_id];

    if (!status) {
      errors.push(`Status is required for employee ${emp_id}`);
      continue;
    }

    const entryTime24 = entryTime ? convertTo24Hour(entryTime) : null;
    const exitTime24 = exitTime ? convertTo24Hour(exitTime) : null;

    values.push([emp_id, date, status, entryTime24, exitTime24]);
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation errors',
      errors: errors
    });
  }

  // Query with ON DUPLICATE KEY for updating same date
  const query = `
    INSERT INTO attendance (emp_id, date, status, entry_time, exit_time)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      entry_time = VALUES(entry_time),
      exit_time = VALUES(exit_time)
  `;

  db.query(query, [values], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        message: 'Failed to save attendance',
        error: err.message 
      });
    }

    const insertedCount = result.affectedRows - (result.changedRows || 0);
    const updatedCount = result.changedRows || 0;
    
    res.status(200).json({
      message: `Attendance processed successfully (${insertedCount} inserted, ${updatedCount} updated)`,
      inserted: insertedCount,
      updated: updatedCount,
      total: values.length
    });
  });
};

// Function to convert AM/PM to 24-hour format for MySQL
const convertTo24Hour = (time) => {
  if (!time) return null;
  const [hourMinute, period] = time.split(" ");
  let [hours, minutes] = hourMinute.split(":");
  hours = parseInt(hours, 10);
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
};

export const updateEmployeeAttendance = async (req, res) => {
  const { emp_id } = req.params;
  const { date, status, entry_time, exit_time } = req.body;

  if (!emp_id || !date || !status) {
    return res.status(400).json({ message: "Invalid data provided" });
  }

  // Normalize the date to YYYY-MM-DD format (strip time component if present)
  const normalizedDate = new Date(date).toISOString().split('T')[0];
  // console.log(`Updating attendance for emp_id: ${emp_id}, date: ${normalizedDate}`);

  // Convert time to 24-hour format for MySQL
  const entryTimeForDB = convertTo24Hour(entry_time);
  const exitTimeForDB = convertTo24Hour(exit_time);

  try {
    // Check if attendance for this employee on this date exists
    const results = await new Promise((resolve, reject) => {
      db.query(
        "SELECT id, date FROM attendance WHERE emp_id = ? AND DATE(date) = ?",
        [emp_id, normalizedDate],
        (err, results) => {
          if (err) reject(err);
          else {
            // console.log(`Found ${results.length} records for emp_id: ${emp_id}, date: ${normalizedDate}`);
            if (results.length > 0) {
              // console.log(`Database date: ${results[0].date}`);
            }
            resolve(results);
          }
        }
      );
    });

    if (results.length > 0) {
      // If record exists, update it
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE attendance SET status = ?, entry_time = ?, exit_time = ? WHERE emp_id = ? AND DATE(date) = ?",
          [status, entryTimeForDB, exitTimeForDB, emp_id, normalizedDate],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      res.status(200).json({ message: "Attendance updated successfully" });
    } else {
      // If no record exists, insert a new one
      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO attendance (emp_id, date, status, entry_time, exit_time) VALUES (?, ?, ?, ?, ?)",
          [emp_id, normalizedDate, status, entryTimeForDB, exitTimeForDB],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      res.status(201).json({ message: "Attendance recorded successfully" });
    }
  } catch (error) {
    console.error("Error handling attendance record:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Attendance record already exists for this date" });
    }
    res.status(500).json({ message: "Failed to handle attendance" });
  }
};

export const getAttendanceStats = (req, res) => {
  const adminId = req.user.adminId;
  const { date } = req.query; // Get date from query params

  if (!date) {
      return res.status(400).json({ error: "Date is required" });
  }

  const query = `
      SELECT status, COUNT(*) AS count 
      FROM attendance 
      WHERE emp_id IN (SELECT emp_id FROM employees WHERE admin_id = ?) 
      AND date = ?
      GROUP BY status;
  `;

  db.query(query, [adminId, date], (err, results) => {
      if (err) {
          console.error("Error fetching attendance stats:", err);
          return res.status(500).json({ error: "Server Error" });
      }

      // Initialize stats with default values
      const stats = { Present: 0, Absent: 0, "Half-Day": 0, Leave: 0 };
      results.forEach(row => (stats[row.status] = row.count));

      res.json(stats);
  });
};




// ✅ Fetch latest attendance by employee ID


export const getEmployeeAttendance = async (req, res) => {
  const emp_id = req.params.emp_id;
  const { month, year } = req.query; // Get month and year from query parameters

  let query = `
      SELECT id, date, status, entry_time, exit_time 
      FROM attendance 
      WHERE emp_id = ? 
  `;
  let values = [emp_id];

  if (month && year) {
    query += " AND MONTH(date) = ? AND YEAR(date) = ?";
    values.push(month, year);
  }

  query += " ORDER BY date DESC";

  try {
    const results = await new Promise((resolve, reject) => {
      db.query(query, values, (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    if (results.length === 0) {
      return res.status(200).json({}); // Return an empty object to match frontend expectation
    }

    // Group results by date to match the structure expected by the frontend
    const groupedResults = results.reduce((acc, record) => {
      const date = new Date(record.date);
      // console.log(`Raw database date for id ${record.id}: ${date.toString()}`); // Log raw date
      // Since the database stores dates in IST, extract the date directly without shifting
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based in JS
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`; // Format as YYYY-MM-DD
      // console.log(`Normalized date for id ${record.id}: ${dateKey}`); // Log normalized date
      // Create a UTC date for the response, preserving the date
      const utcDate = new Date(Date.UTC(year, date.getMonth(), date.getDate(), 0, 0, 0, 0));
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        id: record.id,
        date: utcDate.toISOString(), // Ensure date is in UTC ISO format (e.g., 2025-05-12T00:00:00.000Z)
        status: record.status,
        entry_time: record.entry_time,
        exit_time: record.exit_time,
      });
      return acc;
    }, {});

    res.status(200).json(groupedResults);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Get attendance for specific date
export const getAttendanceByDate = (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ message: 'Date parameter is required' });
  }

  const query = `
    SELECT emp_id, status, entry_time, exit_time 
    FROM attendance 
    WHERE date = ?
  `;

  db.query(query, [date], (err, results) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json(results);
  });
};



// In your attendance controller
export const bulkUpdateAttendance = async (req, res) => {
  try {
    const { date, selectedEmployees } = req.body;
    
    // Get all attendance records for this date
    const existingRecords = await Attendance.findAll({ where: { date } });
    
    // Create a map of existing records by employee ID
    const existingMap = {};
    existingRecords.forEach(record => {
      existingMap[record.emp_id] = record;
    });
    
    // Process each employee in the request
    const results = [];
    for (const emp_id in selectedEmployees) {
      const { status, entryTime, exitTime } = selectedEmployees[emp_id];
      
      if (existingMap[emp_id]) {
        // Update existing record
        const updated = await Attendance.update(
          { status, entry_time: entryTime, exit_time: exitTime },
          { where: { emp_id, date } }
        );
        results.push({ emp_id, action: 'updated' });
      } else {
        // Create new record
        const created = await Attendance.create({
          emp_id,
          date,
          status,
          entry_time: entryTime,
          exit_time: exitTime
        });
        results.push({ emp_id, action: 'created' });
      }
    }
    
    res.status(200).json({ 
      message: 'Attendance records processed successfully',
      results
    });
    
  } catch (error) {
    console.error('Error bulk updating attendance:', error);
    res.status(500).json({ message: 'Failed to process attendance records' });
  }
};

// In your routes
