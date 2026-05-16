const express = require("express");
const router = express.Router();
const { verifySuperAdmin } = require("../middleware/authMiddleware");
const {
  getOverview,
  getLostFound,
  updateLostFound,
  getAspirasi,
  respondAspirasi,
  getNotifikasi,
  markNotifRead,
  markAllNotifsRead,
} = require("../controllers/dashboardController");

// Semua route dashboard hanya bisa diakses superadmin
router.use(verifySuperAdmin);

// ── Overview ──────────────────────────────────
router.get("/overview", getOverview);

// ── Lost & Found ──────────────────────────────
// GET  /api/dashboard/lostfound?status=Pending|Claimed|Expired
router.get("/lostfound", getLostFound);
// PATCH /api/dashboard/lostfound/:id
router.patch("/lostfound/:id", updateLostFound);

// ── Aspirasi ──────────────────────────────────
// GET  /api/dashboard/aspirasi
router.get("/aspirasi", getAspirasi);
// PATCH /api/dashboard/aspirasi/:id/respond
router.patch("/aspirasi/:id/respond", respondAspirasi);

// ── Notifikasi ────────────────────────────────
// PENTING: route statis (/read-all) harus di atas route dinamis (/:id/read)
// supaya Express tidak salah parsing "read-all" sebagai :id

// GET  /api/dashboard/notifikasi?read=...&category=...
router.get("/notifikasi", getNotifikasi);
// PATCH /api/dashboard/notifikasi/read-all
router.patch("/notifikasi/read-all", markAllNotifsRead);
// PATCH /api/dashboard/notifikasi/:id/read
router.patch("/notifikasi/:id/read", markNotifRead);

module.exports = router;