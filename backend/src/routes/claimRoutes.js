const express = require("express");
const router = express.Router();
const claimController = require("../controllers/claimController");
const { verifyToken, verifyAdminOrSuperAdmin } = require("../middleware/authMiddleware");

// POST /api/claim - Buat pengajuan klaim (Student)
router.post("/", verifyToken, claimController.createClaim);

// GET /api/claim/mine - Klaim milik user yang login
router.get("/mine", verifyToken, claimController.getMyClaims);

// GET /api/claim - Ambil semua pengajuan klaim (Admin)
router.get("/", verifyToken, verifyAdminOrSuperAdmin, claimController.getAllClaims);

// PATCH /api/claim/:id/status - Update status klaim (Admin)
router.patch("/:id/status", verifyToken, verifyAdminOrSuperAdmin, claimController.updateClaimStatus);

module.exports = router;