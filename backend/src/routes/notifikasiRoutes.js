const express = require("express");
const router = express.Router();

const notifikasiController = require("../controllers/notifikasiController");
const { verifyToken } = require("../middleware/authMiddleware");
const Notifikasi = require("../models/Notifikasi");

/* ══════════════════════════════════════════
   ADMIN ROUTES
   Prefix: /api/notifikasi
══════════════════════════════════════════ */

// GET semua notifikasi admin
router.get(
  "/",
  verifyToken,
  notifikasiController.getNotifikasi
);

// PATCH semua notif admin jadi read
router.patch(
  "/read-all",
  verifyToken,
  notifikasiController.markAllRead
);

/* ══════════════════════════════════════════
   USER ROUTES
   Prefix: /api/notifikasi/user
══════════════════════════════════════════ */

// GET semua notifikasi milik user yg login
router.get(
  "/user",
  verifyToken,
  notifikasiController.getNotifikasiUser
);

// PATCH semua notif user jadi read
router.patch(
  "/user/read-all",
  verifyToken,
  notifikasiController.markAllReadUser
);

/* ══════════════════════════════════════════
   SHARED ROUTES (admin & user)
══════════════════════════════════════════ */

// PATCH 1 notif jadi read (klik card)
router.patch(
  "/:id/read",
  verifyToken,
  notifikasiController.markOneRead
);

// DELETE 1 notif
router.delete(
  "/:id",
  verifyToken,
  notifikasiController.deleteNotif
);

/* ══════════════════════════════════════════
   DEBUG ENDPOINT (untuk testing saja)
══════════════════════════════════════════ */

// GET semua notifikasi di database (debug)
router.get("/debug/all-notifikasi", async (req, res) => {
  try {
    const allNotifs = await Notifikasi.find()
      .sort({ createdAt: -1 })
      .limit(50);

    const summary = {
      total: await Notifikasi.countDocuments(),

      by_target: {
        admin: await Notifikasi.countDocuments({
          target: "admin",
        }),

        user: await Notifikasi.countDocuments({
          target: "user",
        }),

        all: await Notifikasi.countDocuments({
          target: "all",
        }),
      },

      by_category: {
        "Lost & Found": await Notifikasi.countDocuments({
          category: "Lost & Found",
        }),

        Info: await Notifikasi.countDocuments({
          category: "Info",
        }),

        Aspirasi: await Notifikasi.countDocuments({
          category: "Aspirasi",
        }),

        Sistem: await Notifikasi.countDocuments({
          category: "Sistem",
        }),
      },
    };

    res.json({
      success: true,
      summary,
      latest: allNotifs,
    });
  } catch (err) {
    console.error("debug notif error:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;