import express from "express";

import { verifyToken } from "../middleware/authMiddleware.js";
import { addWeekends, deleteWeekend, getWeekends } from "../controllers/weekendController.js";

const router = express.Router();

// ➡️ Add Weekend
router.post("/add", verifyToken, addWeekends);

// ➡️ Get Weekends
router.get("/get", verifyToken, getWeekends);

// ➡️ Delete Weekend
router.delete("/delete/:id", verifyToken, deleteWeekend);

export default router;
