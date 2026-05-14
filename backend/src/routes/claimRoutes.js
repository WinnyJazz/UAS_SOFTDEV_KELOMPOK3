const express = require("express");
const router = express.Router();
const claimController = require("../controllers/claimController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// POST /api/claim - Buat pengajuan klaim (Student)
router.post("/", verifyToken, claimController.createClaim);

// GET /api/claim - Ambil semua pengajuan klaim (Admin)
router.get("/", verifyToken, verifyAdmin, claimController.getAllClaims);

// PATCH /api/claim/:id/status - Update status klaim (Admin)
router.patch("/:id/status", verifyToken, verifyAdmin, claimController.updateClaimStatus);

module.exports = router;
