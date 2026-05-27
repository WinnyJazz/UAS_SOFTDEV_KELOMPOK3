const Notifikasi = require("../models/Notifikasi");

/* ══════════════════════════════════════════
   HELPER — buat notifikasi dari controller lain
══════════════════════════════════════════ */
const createNotif = async ({
  title,
  desc = "",
  category,
  icon = "🔔",
  iconBg = "#e0e7ff",
  refType = null,
  refId = null,
  target = "admin",
}) => {
  try {
    // 🔥 VALIDASI CATEGORY BIAR NGGAK NGACO
    const allowedCategory = ["Lost & Found", "Aspirasi", "User", "Sistem"];

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
   GET NOTIFIKASI
══════════════════════════════════════════ */
exports.getNotifikasi = async (req, res) => {
  try {
    const { read, category, limit = 50 } = req.query;

    const filter = { target: "admin" };

    if (read === "Belum Dibaca") filter.read = false;
    else if (read === "Sudah Dibaca") filter.read = true;

    if (category && category !== "Semua") {
      filter.category = category;
    }

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

    const data = notifs.map((n) => ({
      id: n.notifId,
      _id: n._id,
      icon: n.icon,
      iconBg: n.iconBg,
      title: n.title,
      desc: n.desc,
      time: formatRelativeTime(n.createdAt),
      read: n.read,
      category: n.category,
      refType: n.refType,
      refId: n.refId,
    }));

    res.json({ success: true, data, unreadCount });
  } catch (err) {
    console.error("getNotifikasi error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════
   MARK ONE READ
══════════════════════════════════════════ */
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

    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════
   MARK ALL READ
══════════════════════════════════════════ */
exports.markAllRead = async (req, res) => {
  try {
    await Notifikasi.updateMany(
      { target: "admin", read: false },
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

/* ══════════════════════════════════════════
   DELETE NOTIF
══════════════════════════════════════════ */
exports.deleteNotif = async (req, res) => {
  try {
    await Notifikasi.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notifikasi dihapus." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ══════════════════════════════════════════
   EXPORT HELPER
══════════════════════════════════════════ */
exports.createNotif = createNotif;