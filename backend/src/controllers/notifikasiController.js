const Notifikasi = require("../models/Notifikasi");

/* ══════════════════════════════════════════
   HELPER — buat notifikasi dari controller lain
   Bisa target "admin" atau userId tertentu
══════════════════════════════════════════ */
const createNotif = async ({
  title,
  desc = "",
  category,
  icon = "🔔",
  iconBg = "#e0e7ff",
  refType = null,
  refId = null,
  target = "admin",   // "admin" | userId (string)
}) => {
  try {
    const allowedCategory = ["Lost & Found", "Aspirasi", "Info", "Sistem"];

    if (!allowedCategory.includes(category)) {
      category = "Sistem";
    }

    const notif = new Notifikasi({
      title,
      desc,
      category,
      icon,
      iconBg,
      refType,
      refId,
      target,
      read: false,
    });

    await notif.save();
    return notif;
  } catch (err) {
    console.error("createNotif error:", err.message);
    return null;
  }
};

/* ══════════════════════════════════════════
   FORMAT waktu relatif
══════════════════════════════════════════ */
const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;

  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/* ══════════════════════════════════════════
   HELPER — format notif item (reuse)
══════════════════════════════════════════ */
const formatNotif = (n) => ({
  id: n.notifId,
  _id: n._id,
  icon: n.icon,
  iconBg: n.iconBg,
  title: n.title,
  desc: n.desc,
  time: formatRelativeTime(n.createdAt),
  createdAt: n.createdAt,
  read: n.read,
  category: n.category,
  refType: n.refType,
  refId: n.refId,
});

/* ══════════════════════════════════════════════════════
   ██████  ADMIN ENDPOINTS
══════════════════════════════════════════════════════ */

/**
 * GET /api/notifikasi  (admin)
 * Filter: target = "admin"
 */
exports.getNotifikasi = async (req, res) => {
  try {
    const { read, category, limit = 50 } = req.query;

    const filter = { target: "admin" };

    if (read === "Belum Dibaca") filter.read = false;
    else if (read === "Sudah Dibaca") filter.read = true;

    if (category && category !== "Semua") {
      filter.category = category;
    }

    const notifs = await Notifikasi.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notifikasi.countDocuments({
      target: "admin",
      read: false,
    });

    res.json({
      success: true,
      data: notifs.map(formatNotif),
      unreadCount,
    });
  } catch (err) {
    console.error("getNotifikasi error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/notifikasi/read-all  (admin)
 */
exports.markAllRead = async (req, res) => {
  try {
    await Notifikasi.updateMany(
      { target: "admin", read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: "Semua notifikasi admin ditandai dibaca.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   ██████  USER ENDPOINTS
   Semua filter by userId dari req.user (JWT payload)
══════════════════════════════════════════════════════ */

/**
 * GET /api/notifikasi/user
 * Ambil semua notifikasi milik user yang sedang login
 */
exports.getNotifikasiUser = async (req, res) => {
  try {
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    console.log("[getNotifikasiUser] userId dari JWT:", userId);
    console.log("[getNotifikasiUser] req.user:", req.user);

    if (!userId) {
      console.warn("⚠️ [getNotifikasiUser] userId tidak ada!");
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    const { read, category, limit = 50 } = req.query;

    // target bisa berupa userId string ATAU "all" (broadcast ke semua user)
    const filter = {
      $or: [
        { target: String(userId) },
        { target: "all" },
      ],
    };

    console.log("🎯 [getNotifikasiUser] filter:", filter);

    if (read === "Belum Dibaca") filter.read = false;
    else if (read === "Sudah Dibaca") filter.read = true;

    if (category && category !== "Semua") {
      filter.category = category;
    }

    const notifs = await Notifikasi.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    console.log("✅ [getNotifikasiUser] ditemukan", notifs.length, "notifikasi");
    console.log("📦 [getNotifikasiUser] notifs:", notifs.map((n) => ({ title: n.title, target: n.target })));

    const unreadCount = await Notifikasi.countDocuments({
      $or: [{ target: String(userId) }, { target: "all" }],
      read: false,
    });

    res.json({
      success: true,
      data: notifs.map(formatNotif),
      unreadCount,
    });
  } catch (err) {
    console.error("❌ getNotifikasiUser error:", err);
    console.error("   Stack:", err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/notifikasi/user/read-all
 * Tandai semua notifikasi user sebagai dibaca
 */
exports.markAllReadUser = async (req, res) => {
  try {
    const userId =
      req.user?.userId ||
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    await Notifikasi.updateMany(
      {
        $or: [{ target: String(userId) }, { target: "all" }],
        read: false,
      },
      { read: true }
    );

    res.json({
      success: true,
      message: "Semua notifikasi ditandai dibaca.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════════════════
   ██████  SHARED ENDPOINTS (admin & user)
══════════════════════════════════════════════════════ */

/**
 * PATCH /api/notifikasi/:id/read
 * Tandai 1 notif sebagai dibaca
 */
exports.markOneRead = async (req, res) => {
  try {
    const notif = await Notifikasi.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({
        success: false,
        message: "Notifikasi tidak ditemukan.",
      });
    }

    res.json({ success: true, data: formatNotif(notif) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/notifikasi/:id
 * Hapus notifikasi
 */
exports.deleteNotif = async (req, res) => {
  try {
    const deleted = await Notifikasi.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notifikasi tidak ditemukan.",
      });
    }

    res.json({ success: true, message: "Notifikasi dihapus." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════
   EXPORT HELPER
══════════════════════════════════════════ */
exports.createNotif = createNotif;