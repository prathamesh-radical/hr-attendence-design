// controllers/leavesController.js
import db from '../db/db.js'

export const addOrUpdateLeaveDays = (req, res) => {
  const { adminId, leaveDays } = req.body;

  const checkSql = 'SELECT * FROM leaves WHERE adminId = ?';
  db.query(checkSql, [adminId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err.message });

    if (result.length > 0) {
      // Update existing
      const updateSql = 'UPDATE leaves SET leaveDays = ? WHERE adminId = ?';
      db.query(updateSql, [leaveDays, adminId], (err) => {
        if (err) return res.status(500).json({ message: 'Update error', error: err.message });
        return res.status(200).json({ message: 'Leave days updated successfully' });
      });
    } else {
      // Insert new
      const insertSql = 'INSERT INTO leaves (adminId, leaveDays) VALUES (?, ?)';
      db.query(insertSql, [adminId, leaveDays], (err) => {
        if (err) return res.status(500).json({ message: 'Insert error', error: err.message });
        return res.status(201).json({ message: 'Leave days added successfully' });
      });
    }
  });
};


export const getLeaveDays = (req, res) => {
    const { adminId } = req.params;
  
    const sql = 'SELECT leaveDays FROM leaves WHERE adminId = ?';
    db.query(sql, [adminId], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err.message });
  
      if (result.length === 0) {
        return res.status(404).json({ message: 'No leave record found' });
      }
  
      res.status(200).json(result[0]);
    });
  };
  