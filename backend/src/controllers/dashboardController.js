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
// Helper: map status Aspirasi DB → label frontend
// ─────────────────────────────────────────────
function mapAspirasiStatus(raw) {
  const map = {
    pending: "Pending",
    diproses: "Dalam Proses",
    disetujui: "Selesai",
    ditolak: "Ditolak",
  };
  return map[raw] ?? "Pending";
}

// ─────────────────────────────────────────────
// GET /api/dashboard/overview
// ─────────────────────────────────────────────
exports.getOverview = async (req, res) => {
  try {
    // ── Lost & Found ──
    const totalBarang = await Barang.countDocuments();

    // Claim yang sudah disetujui/selesai → barang dianggap "Claimed"
    const claimedClaims = await Claim.find({
      status: { $in: ["disetujui", "selesai"] },
    }).select("barangId");
    const claimedBarangIds = new Set(claimedClaims.map((c) => c.barangId));

    const claimedCount = claimedBarangIds.size;
    const expiredCount = await Barang.countDocuments({
      status: { $in: ["hilang", "rusak"] },
    });
    const pendingCount = totalBarang - claimedCount - expiredCount;

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

// ─────────────────────────────────────────────
// GET /api/dashboard/lostfound?status=Pending|Claimed|Expired
// ─────────────────────────────────────────────
exports.getLostFound = async (req, res) => {
  try {
    const { status } = req.query; // "Pending" | "Claimed" | "Expired" | undefined

    // Ambil semua barang
    let barangQuery = {};
    if (status === "Expired") {
      barangQuery = { status: { $in: ["hilang", "rusak"] } };
    } else if (status === "Pending") {
      barangQuery = { status: { $in: ["tersedia", "dipinjam"] } };
    }
    // "Claimed" dan "Semua" → ambil semua dulu, filter nanti

    const barangs = await Barang.find(barangQuery).sort({ tanggal: -1 }).lean();

    // Ambil semua claim yang disetujui/selesai untuk filter Claimed
    const approvedClaims = await Claim.find({
      status: { $in: ["disetujui", "selesai"] },
    })
      .select("barangId userId nama nim")
      .lean();

    const claimedMap = new Map(); // barangId → claim data
    approvedClaims.forEach((c) => {
      claimedMap.set(c.barangId, c);
    });

    const claimedBarangIds = new Set(claimedMap.keys());

    // Map tiap barang ke format frontend
    let mapped = barangs.map((b) => {
      const lfStatus = mapLFStatus(b, claimedBarangIds);
      const claim = claimedMap.get(b.barangId);

      return {
        id: b.barangId || b._id.toString(),
        barang: b.nama,
        penemu: b.deskripsi ?? "—", // Barang model tidak punya field penemu,
        // pakai deskripsi sebagai fallback atau kosongkan
        lokasi: b.lokasi,
        tanggal: b.tanggal
          ? new Date(b.tanggal).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
        status: lfStatus,
        claimedBy: claim ? `${claim.nama} (${claim.nim})` : "",
      };
    });

    // Filter status "Claimed" (tidak bisa dilakukan di query Barang)
    if (status === "Claimed") {
      mapped = mapped.filter((i) => i.status === "Claimed");
    } else if (status === "Pending") {
      mapped = mapped.filter((i) => i.status === "Pending");
    }
    // "Expired" sudah difilter di query, "Semua" tidak perlu filter

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("getLostFound error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/dashboard/lostfound/:id
// Body: { status: "Pending"|"Claimed"|"Expired", claimedBy?: string }
// ─────────────────────────────────────────────
exports.updateLostFound = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, claimedBy } = req.body;

    // Map frontend status → DB enum
    const statusMap = {
      Pending: "tersedia",
      Claimed: "dipinjam", // tandai dipinjam saat diklaim
      Expired: "hilang",
    };

    const dbStatus = statusMap[status];
    if (!dbStatus) {
      return res.status(400).json({ success: false, message: "Status tidak valid" });
    }

    const barang = await Barang.findOneAndUpdate(
      { barangId: id },
      { status: dbStatus },
      { new: true }
    );

    if (!barang) {
      return res.status(404).json({ success: false, message: "Barang tidak ditemukan" });
    }

    return res.json({
      success: true,
      message: "Status barang berhasil diupdate",
      data: { id, status, claimedBy: claimedBy ?? "" },
    });
  } catch (err) {
    console.error("updateLostFound error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/aspirasi
// Returns: { success, data: { "Mei 2025": [...], "April 2025": [...] } }
// ─────────────────────────────────────────────
exports.getAspirasi = async (req, res) => {
  try {
    const aspirasis = await Aspirasi.find()
      .sort({ createdAt: -1 })
      .lean();

    // Kelompokkan per bulan (format "Mei 2025")
    const grouped = {};

    aspirasis.forEach((a) => {
      const date = new Date(a.createdAt);
      const monthKey = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      if (!grouped[monthKey]) grouped[monthKey] = [];

      grouped[monthKey].push({
        id: a.aspirasiId || a._id.toString(),
        _id: a._id.toString(),
        judul: a.judul,
        isi: a.deskripsi,         // frontend pakai "isi", DB pakai "deskripsi"
        kategori: a.kategori,
        status: mapAspirasiStatus(a.status),
        statusRaw: a.status,
        tanggal: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        response: a.responAdmin ?? null,
        userId: a.userId,
      });
    });

    return res.json({ success: true, data: grouped });
  } catch (err) {
    console.error("getAspirasi error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/dashboard/aspirasi/:id/respond
// Body: { status: "diproses"|"disetujui"|"ditolak", responAdmin: string }
// ─────────────────────────────────────────────
exports.respondAspirasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responAdmin } = req.body;

    const validStatuses = ["diproses", "disetujui", "ditolak"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Status tidak valid" });
    }

    if (!responAdmin || !responAdmin.trim()) {
      return res.status(400).json({ success: false, message: "Respon tidak boleh kosong" });
    }

    // Cari berdasarkan aspirasiId (custom field) ATAU _id
    const aspirasi = await Aspirasi.findOneAndUpdate(
      { $or: [{ aspirasiId: id }, { _id: id }] },
      { status, responAdmin: responAdmin.trim() },
      { new: true }
    );

    if (!aspirasi) {
      return res.status(404).json({ success: false, message: "Aspirasi tidak ditemukan" });
    }

    // Kirim notifikasi ke mahasiswa (jika notifikasi diperlukan)
    try {
      await Notifikasi.create({
        userId: aspirasi.userId,
        pesan: `Aspirasi "${aspirasi.judul}" telah diupdate: ${mapAspirasiStatus(status)}`,
        isRead: false,
        target: {
          refId: aspirasi.aspirasiId || aspirasi._id.toString(),
          refModel: "Aspirasi",
        },
      });
    } catch (notifErr) {
      // Jangan gagalkan request hanya karena notifikasi gagal
      console.error("Gagal buat notifikasi aspirasi:", notifErr);
    }

    return res.json({
      success: true,
      message: "Respon aspirasi berhasil disimpan",
      data: {
        id,
        status,
        statusLabel: mapAspirasiStatus(status),
        responAdmin: responAdmin.trim(),
      },
    });
  } catch (err) {
    console.error("respondAspirasi error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/notifikasi?read=Belum+Dibaca|Sudah+Dibaca&category=...
// ─────────────────────────────────────────────
exports.getNotifikasi = async (req, res) => {
  try {
    const { read, category } = req.query;

    const query = {};

    // Filter read
    if (read === "Belum Dibaca") query.isRead = false;
    else if (read === "Sudah Dibaca") query.isRead = true;

    // Filter category (pakai target.refModel)
    if (category && category !== "Semua") {
      const refModelMap = {
        "Lost & Found": "Barang",
        Aspirasi: "Aspirasi",
        User: null,    // notif user tidak punya refModel spesifik
        Sistem: null,
      };
      const refModel = refModelMap[category];
      if (refModel) {
        query["target.refModel"] = refModel;
      }
    }

    const notifs = await Notifikasi.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notifikasi.countDocuments({ isRead: false });

    // Map ke format frontend
    const mapped = notifs.map((n) => {
      // Tentukan icon & category berdasarkan refModel
      const refModel = n.target?.refModel;
      let icon = "🔔";
      let iconBg = "#f3f4f6";
      let cat = "Sistem";

      if (refModel === "Aspirasi") { icon = "💬"; iconBg = "#d1fae5"; cat = "Aspirasi"; }
      else if (refModel === "Claim" || refModel === "Barang") { icon = "📦"; iconBg = "#ede9fe"; cat = "Lost & Found"; }
      else if (refModel === "Informasi") { icon = "ℹ️"; iconBg = "#dbeafe"; cat = "Sistem"; }

      return {
        id: n.notifikasiId || n._id.toString(),
        _id: n._id.toString(),
        icon,
        iconBg,
        title: n.pesan.length > 50 ? n.pesan.substring(0, 47) + "..." : n.pesan,
        desc: n.pesan,
        time: formatRelativeTime(n.createdAt),
        read: n.isRead,
        category: cat,
      };
    });

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

    await Notifikasi.findOneAndUpdate(
      { $or: [{ notifikasiId: id }, { _id: id }] },
      { isRead: true }
    );

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
    await Notifikasi.updateMany({ isRead: false }, { isRead: true });

    return res.json({ success: true, message: "Semua notifikasi ditandai sudah dibaca" });
  } catch (err) {
    console.error("markAllNotifsRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};