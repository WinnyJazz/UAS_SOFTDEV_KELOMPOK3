const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  resendVerification,
} = require("../controllers/authController");

// POST /api/auth/register
router.post("/register", register);

// GET  /api/auth/verify-email?token=xxx
router.get("/verify-email", verifyEmail);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/resend-verification
router.post("/resend-verification", resendVerification);

module.exports = router;