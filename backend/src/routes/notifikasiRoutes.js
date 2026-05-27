// routes/notifikasiRoutes.js
// Daftarkan di app.js/server.js:
//   const notifRoutes = require("./routes/notifikasiRoutes");
//   app.use("/api/dashboard", notifRoutes);

const express = require("express");
const router  = express.Router();
const {
  getNotifikasi,
  markOneRead,
  markAllRead,
  deleteNotif,
} = require("../controllers/notifikasiController");

// Middleware auth — sesuaikan dengan nama middleware kamu
const authMiddleware = require("../middleware/auth");

// GET  /api/dashboard/notifikasi
router.get("/notifikasi", authMiddleware, getNotifikasi);

// PATCH /api/dashboard/notifikasi/read-all   ← harus SEBELUM /:id
router.patch("/notifikasi/read-all", authMiddleware, markAllRead);

// PATCH /api/dashboard/notifikasi/:id/read
router.patch("/notifikasi/:id/read", authMiddleware, markOneRead);

// DELETE /api/dashboard/notifikasi/:id
router.delete("/notifikasi/:id", authMiddleware, deleteNotif);

module.exports = router;