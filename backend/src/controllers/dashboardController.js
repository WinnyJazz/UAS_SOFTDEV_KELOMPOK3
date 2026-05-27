const Barang = require("../models/Barang");
const Claim = require("../models/Claim");
const Aspirasi = require("../models/Aspirasi");
const Notifikasi = require("../models/Notifikasi");
const Mahasiswa = require("../models/Mahasiswa");
const Admin = require("../models/Admin");

// ─────────────────────────────────────────────
// Helper: format tanggal relatif (untuk aktivitas terbaru)
// ─────────────────────────────────────────────
function formatRelativeTime(date) {
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // detik

  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 172800) return "Kemarin";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─────────────────────────────────────────────
// Helper: map status Barang DB → label frontend
// ─────────────────────────────────────────────
// Barang.status enum: "tersedia" | "dipinjam" | "hilang" | "rusak"
// Claim.status enum : "pending" | "disetujui" | "ditolak" | "selesai"
//
// Logika pemetaan ke LFStatus frontend (Pending | Claimed | Expired):
//   - Barang punya Claim disetujui/selesai → "Claimed"
//   - Barang status "hilang" / "rusak"     → "Expired"
//   - Sisanya                              → "Pending"
// ─────────────────────────────────────────────
function mapLFStatus(barang, claimedBarangIds) {
  if (claimedBarangIds.has(barang.barangId)) return "Claimed";
  if (barang.status === "hilang" || barang.status === "rusak") return "Expired";
  return "Pending";
}

// ─────────────────────────────────────────────
// GET /api/dashboard/overview
// ─────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    // Claim yang sudah disetujui/selesai → barang dianggap "Claimed"
    // ── Lost & Found ──
    const totalBarang = await Barang.countDocuments();

    const claimedCount = await Barang.countDocuments({
      status: "dipinjam",
    });

    const expiredCount = await Barang.countDocuments({
      status: { $in: ["hilang", "rusak"] },
    });

    const pendingCount = await Barang.countDocuments({
      status: "tersedia",
    });

    // ── Aspirasi ──
    const totalAspirasi = await Aspirasi.countDocuments();
    const dalamProses = await Aspirasi.countDocuments({ status: "diproses" });
    const selesai = await Aspirasi.countDocuments({ status: "disetujui" });

    // ── Users ──
    const totalMahasiswa = await Mahasiswa.countDocuments();
    const terverifikasi = await Mahasiswa.countDocuments({ isVerified: true });
    const belumVerifikasi = totalMahasiswa - terverifikasi;
    const totalAdmin = await Admin.countDocuments({ role: "admin" });
    const unreadNotif = await Notifikasi.countDocuments({ isRead: false });

    // ── Aktivitas Terbaru (gabungan Claim + Aspirasi + Mahasiswa baru) ──
    const [recentClaims, recentAspirasi, recentMahasiswa] = await Promise.all([
      Claim.find()
        .sort({ tanggal: -1 })
        .limit(3)
        .populate({ path: "barangId", model: "Barang", localField: "barangId", foreignField: "barangId", select: "nama" })
        .lean(),
      Aspirasi.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Mahasiswa.find()
        .sort({ createdAt: -1 })
        .limit(2)
        .lean(),
    ]);

    const recentActivity = [];

    recentClaims.forEach((c) => {
      recentActivity.push({
        icon: "📦",
        iconBg: "#ede9fe",
        text: `${c.nama} mengklaim barang`,
        time: formatRelativeTime(c.tanggal),
        category: "Lost & Found",
        _date: c.tanggal,
      });
    });

    recentAspirasi.forEach((a) => {
      recentActivity.push({
        icon: "💬",
        iconBg: "#d1fae5",
        text: `Aspirasi baru: "${a.judul}"`,
        time: formatRelativeTime(a.createdAt),
        category: "Aspirasi",
        _date: a.createdAt,
      });
    });

    recentMahasiswa.forEach((m) => {
      recentActivity.push({
        icon: "👤",
        iconBg: "#dbeafe",
        text: `User baru terdaftar: ${m.email}`,
        time: formatRelativeTime(m.createdAt),
        category: "User",
        _date: m.createdAt,
      });
    });

    // Urutkan berdasarkan tanggal terbaru, ambil 5 teratas
    recentActivity.sort((a, b) => new Date(b._date) - new Date(a._date));
    const top5 = recentActivity.slice(0, 5).map(({ _date, ...rest }) => rest);

    return res.json({
      success: true,
      data: {
        lostFound: {
          totalBarang,
          claimed: claimedCount,
          pending: Math.max(0, pendingCount),
          expired: expiredCount,
        },
        aspirasi: {
          totalAspirasi,
          dalamProses,
          selesai,
        },
        users: {
          totalMahasiswa,
          terverifikasi,
          belumVerifikasi,
          totalAdmin,
          unreadNotif,
        },
        recentActivity: top5,
      },
    });
  } catch (err) {
    console.error("getOverview error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/dashboard/lostfound
exports.getLostFound = async (req, res) => {
  try {
    const barangList = await Barang.find().sort({ tanggal: -1 });

    const mapped = barangList.map((b, index) => ({
      id: index + 1,
      barang: b.nama,
      penemu: "Admin",
      lokasi: b.lokasi,
      tanggal: new Date(b.tanggal).toLocaleDateString("id-ID"),
      status:
        b.status === "dipinjam"
          ? "Claimed"
          : b.status === "hilang" || b.status === "rusak"
          ? "Expired"
          : "Pending",
    }));

    res.json({
      success: true,
      data: mapped,
    });
  } catch (err) {
    console.error("getLostFound error:", err);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data lost found",
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/notifikasi?read=Belum+Dibaca|Sudah+Dibaca&category=...
// ─────────────────────────────────────────────
exports.getNotifikasi = async (req, res) => {
  try {
    const { read, category } = req.query;

    const query = { target: "admin" }; // ✅ filter target admin

    // ✅ pakai field "read" sesuai schema
    if (read === "Belum Dibaca") query.read = false;
    else if (read === "Sudah Dibaca") query.read = true;

    // ✅ pakai field "category" langsung sesuai schema
    if (category && category !== "Semua") {
      query.category = category;
    }

    const notifs = await Notifikasi.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notifikasi.countDocuments({
      target: "admin",
      read: false, // ✅ konsisten
    });

    // ✅ langsung pakai data dari DB, tidak perlu derive ulang
    const mapped = notifs.map((n) => ({
      id: n.notifId || n._id.toString(),
      _id: n._id.toString(),
      icon: n.icon,
      iconBg: n.iconBg,
      title: n.title?.length > 50 ? n.title.substring(0, 47) + "..." : n.title,
      desc: n.desc || "",
      time: formatRelativeTime(n.createdAt),
      read: n.read,
      category: n.category,
      refType: n.refType,
      refId: n.refId,
    }));

    return res.json({ success: true, data: mapped, unreadCount });
  } catch (err) {
    console.error("getNotifikasi error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/dashboard/notifikasi/:id/read
// ─────────────────────────────────────────────
exports.markNotifRead = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ coba match notifId dulu, fallback ke _id
    const notif = await Notifikasi.findOneAndUpdate(
      { $or: [{ notifId: id }, { _id: id }] }, // ✅ "notifId" bukan "notifikasiId"
      { read: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notifikasi tidak ditemukan" });
    }

    return res.json({ success: true, message: "Notifikasi ditandai sudah dibaca" });
  } catch (err) {
    console.error("markNotifRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/dashboard/notifikasi/read-all
// ─────────────────────────────────────────────
exports.markAllNotifsRead = async (req, res) => {
  try {
    await Notifikasi.updateMany(
      { target: "admin", read: false }, // ✅ tambah filter target
      { read: true }
    );

    return res.json({ success: true, message: "Semua notifikasi ditandai sudah dibaca" });
  } catch (err) {
    console.error("markAllNotifsRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteNotif = async (req, res) => {
  try {
    const { id } = req.params;

    const notif = await Notifikasi.findOneAndDelete({
      $or: [{ notifId: id }, { _id: id }],
    });

    if (!notif) {
      return res.status(404).json({ success: false, message: "Notifikasi tidak ditemukan" });
    }

    return res.json({ success: true, message: "Notifikasi dihapus" });
  } catch (err) {
    console.error("deleteNotif error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};