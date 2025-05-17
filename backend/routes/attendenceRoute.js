// routes/attendanceRouter.js
import express from "express";
import { bulkUpdateAttendance, getAttendanceByDate, getAttendanceStats, getEmployeeAttendance, submitAttendance, updateEmployeeAttendance } from "../controllers/attendenceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to submit attendance
router.post("/submit", submitAttendance);
router.put("/update/:emp_id", updateEmployeeAttendance);
router.get("/stats", verifyToken,getAttendanceStats);
router.get("/:emp_id", getEmployeeAttendance);
router.get('/', getAttendanceByDate);
router.put('/bulk-update',bulkUpdateAttendance);

export default router;