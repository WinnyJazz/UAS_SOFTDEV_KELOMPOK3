const express = require("express");
const router = express.Router();

const {
  getNotifikasi,
  markOneRead,
  markAllRead,
  deleteNotif,
} = require("../controllers/notifikasiController");

// middleware auth kamu
const authMiddleware = require("../middleware/auth");

/**
 * GET all notifikasi (admin)
 * /api/dashboard/notifikasi
 */
router.get("/notifikasi", authMiddleware, getNotifikasi);

/**
 * PATCH semua notifikasi jadi read
 * /api/dashboard/notifikasi/read-all
 */
router.patch("/notifikasi/read-all", authMiddleware, markAllRead);

/**
 * PATCH 1 notifikasi read
 * /api/dashboard/notifikasi/:id/read
 */
router.patch("/notifikasi/:id/read", authMiddleware, markOneRead);

/**
 * DELETE notifikasi
 * /api/dashboard/notifikasi/:id
 */
router.delete("/notifikasi/:id", authMiddleware, deleteNotif);

module.exports = router;