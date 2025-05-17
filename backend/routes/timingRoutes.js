import express from 'express';

import { verifyToken } from '../middleware/authMiddleware.js';
import { addOfficeTime, getOfficeTime } from '../controllers/timingController.js';


const router = express.Router();

router.post('/add-time', verifyToken, addOfficeTime);
router.get('/get', verifyToken, getOfficeTime);

export default router;
