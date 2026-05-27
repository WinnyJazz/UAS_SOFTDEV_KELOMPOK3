const express = require("express");
const router = express.Router();
const { verifySuperAdmin } = require("../middleware/authMiddleware");
const { verifyAdminOrSuperAdmin } = require("../middleware/authMiddleware");

const {
  getOverview,
  getNotifikasi,
  markNotifRead,
  markAllNotifsRead,
  getLostFound,
  deleteNotif,
} = require("../controllers/dashboardController");

// Semua route dashboard hanya bisa diakses superadmin
router.use(verifyAdminOrSuperAdmin);

// ── Overview ──────────────────────────────────
router.get("/overview", getOverview);
router.get("/lostfound", getLostFound);

// ── Notifikasi ────────────────────────────────
// PENTING: route statis (/read-all) harus di atas route dinamis (/:id/read)
// supaya Express tidak salah parsing "read-all" sebagai :id

// GET  /api/dashboard/notifikasi?read=...&category=...
router.get("/notifikasi", getNotifikasi);
// PATCH /api/dashboard/notifikasi/read-all
router.patch("/notifikasi/read-all", markAllNotifsRead);
// PATCH /api/dashboard/notifikasi/:id/read
router.patch("/notifikasi/:id/read", markNotifRead);
// buat delete
router.delete("/notifikasi/:id", deleteNotif);

module.exports = router;