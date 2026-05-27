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

    const notif = new Notifikasi({
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

    console.log("📝 [createNotif] mau save notif:", notif);

    const saved = await notif.save();

    console.log("✅ [createNotif] berhasil disimpan, _id:", saved._id);
    return saved;
  } catch (err) {
    console.error("❌ [createNotif] ERROR:", err); // <-- lihat full error disini
    return null;
  }
};

module.exports = { createNotif };