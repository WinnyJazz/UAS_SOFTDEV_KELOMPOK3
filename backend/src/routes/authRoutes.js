const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  resendVerification,
  registerAdmin,
  getAllUsers,
  changeRole,
  downgradeAdmin,
  forgotPassword,
  resetPassword,
  updateProfile,
  deleteUser,
} = require("../controllers/authController");

const { verifyToken, verifySuperAdmin, verifyAdminOrSuperAdmin } = require("../middleware/authMiddleware");

router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/update-profile", verifyToken, updateProfile);
router.post("/register-admin", verifySuperAdmin, registerAdmin);
router.get("/users", verifyAdminOrSuperAdmin, getAllUsers);
router.post("/resend-verification", resendVerification);
router.post("/change-role", verifySuperAdmin, changeRole);
router.post("/downgrade-admin", verifySuperAdmin, downgradeAdmin);
router.delete("/users/:userId", verifySuperAdmin, deleteUser);

module.exports = router;