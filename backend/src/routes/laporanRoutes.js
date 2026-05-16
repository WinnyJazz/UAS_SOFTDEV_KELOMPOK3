const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// POST /api/laporan - User buat laporan barang hilang
router.post("/", verifyToken, laporanController.createLaporan);

// GET /api/laporan/mine - User lihat laporan mereka sendiri
router.get("/mine", verifyToken, laporanController.getMyLaporan);

// GET /api/laporan - Admin lihat semua laporan
router.get("/", verifyToken, verifyAdmin, laporanController.getAllLaporan);

// PATCH /api/laporan/:id/status - Admin update status laporan
router.patch("/:id/status", verifyToken, verifyAdmin, laporanController.updateLaporanStatus);

module.exports = router;
