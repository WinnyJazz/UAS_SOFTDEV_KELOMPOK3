const Notifikasi = require("../models/Notifikasi");

const createNotif = async ({
  title,
  desc = "",
  category = "Sistem",
  icon = "🔔",
  iconBg = "#e0e7ff",
  refType = null,
  refId = null,
  target = "admin",
}) => {
  try {
    console.log("🔥 [createNotif] dipanggil dengan:", { title, category, target });

    const allowedCategory = ["Lost & Found", "Aspirasi", "User", "Sistem"];
    if (!allowedCategory.includes(category)) {
      console.warn(`⚠️ Category "${category}" tidak valid, fallback ke Sistem`);
      category = "Sistem";
    }

    // Generate notifId di helper, jangan andalkan pre-hook
    const notifId = `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const notif = new Notifikasi({
      notifId,
      title,
      desc,
      category,
      icon,
      iconBg,
      refType,
      refId: refId ? String(refId) : null,
      target,
      read: false,
    });

    console.log("📝 [createNotif] mau save notif:", { title, category, target });

    const saved = await notif.save();

    console.log("✅ [createNotif] berhasil disimpan, _id:", saved._id, "notifId:", saved.notifId);
    return saved;
  } catch (err) {
    console.error("❌ [createNotif] ERROR:", err.message);
    console.error("   Stack:", err.stack);
    return null;
  }
};

module.exports = { createNotif };