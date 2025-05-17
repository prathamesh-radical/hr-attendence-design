import express from 'express';
import { addHolidays, getHolidays, removeHoliday } from '../controllers/holidaysController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add',verifyToken, addHolidays);
router.get("/holidays", verifyToken, getHolidays);
router.delete("/remove",verifyToken,removeHoliday);

export default router;
