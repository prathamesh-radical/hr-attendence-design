import express from "express";
import {  activateEmployee, deactivateEmployee, employeeCount, getDeactivatedEmployees, getEmployeeDetails, getEmployeesByAdmin, registerEmployee, updateEmployeeDetails } from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect employee registration with token verification
router.post("/register", verifyToken, registerEmployee);
router.get("/", verifyToken, getEmployeesByAdmin);
router.get("/count", verifyToken, employeeCount);
router.get("/deactivated", verifyToken, getDeactivatedEmployees);
router.put("/deactivate/:emp_id", verifyToken, deactivateEmployee);
router.put("/activate/:emp_id", verifyToken, activateEmployee);
router.get("/data/:emp_id",verifyToken, getEmployeeDetails);
router.put("/update/:emp_id", verifyToken, updateEmployeeDetails);


export default router;
