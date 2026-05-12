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
} = require("../controllers/authController");

const { verifySuperAdmin, verifyAdminOrSuperAdmin } = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", register);

// GET  /api/auth/verify-email?token=xxx
router.get("/verify-email", verifyEmail);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

// POST /api/auth/register-admin (hanya superadmin)
router.post("/register-admin", verifySuperAdmin, registerAdmin);

// GET /api/auth/users (admin/superadmin)
router.get("/users", verifyAdminOrSuperAdmin, getAllUsers);

// POST /api/auth/resend-verification
router.post("/resend-verification", resendVerification);

// POST /api/auth/change-role (hanya superadmin)
router.post("/change-role", verifySuperAdmin, changeRole);

// POST /api/auth/downgrade-admin (hanya superadmin)
router.post("/downgrade-admin", verifySuperAdmin, downgradeAdmin);

module.exports = router;