// routes/leaves.js
import express from 'express';
import { addOrUpdateLeaveDays, getLeaveDays } from '../controllers/leavesController.js';

const router = express.Router();

router.post('/leaves-add', addOrUpdateLeaveDays);
router.get('/leaves-get/:adminId', getLeaveDays);

export default router;
