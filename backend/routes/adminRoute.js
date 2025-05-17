import express from "express";
import { deactivateAccount, getAdminProfile, updateAdminProfile, updatePassword,  verifyPassword } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", verifyToken, getAdminProfile);
router.put("/update-profile", verifyToken, updateAdminProfile);
router.put("/change-password", verifyToken,updatePassword);
router.post("/verify-password", verifyToken,verifyPassword);
router.post("/deactivate-account", verifyToken,deactivateAccount);

export default router;
