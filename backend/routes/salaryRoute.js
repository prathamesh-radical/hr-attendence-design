import express from 'express';
import { addOrUpdateSalary, addSalaryIncrement, editIncrement, getEmployeeStatusAndSalary, getSalaryByEmpId } from '../controllers/salaryController.js';

const router = express.Router();

router.post('/salary', addOrUpdateSalary);
router.get('/salary/:emp_id', getSalaryByEmpId);
router.get('/:empId', getEmployeeStatusAndSalary);
router.post('/increment', addSalaryIncrement);
router.put('/increment/:id', editIncrement);



export default router;
