// Dashboard bukan entitas yang disimpan di DB secara permanen,
// tapi berdasarkan class diagram punya state dan methods,
// jadi kita buat sebagai Schema yang di-refresh berkala (atau computed on-the-fly)

const mongoose = require("mongoose");

const DashboardSchema = new mongoose.Schema(
  {
    // Bisa ada 1 dokumen dashboard yang terus di-update (singleton pattern)
    totalBarangTemuan: {
      type: Number,
      default: 0,
    },
    claimRequestCount: {
      type: Number,
      default: 0,
    },
    totalAspirasi: {
      type: Number,
      default: 0,
    },
    totalBarangDikembalikan: {
      type: Number,
      default: 0,
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// Method: getAspirasiStats - return AspirasHelper value object
DashboardSchema.methods.getAspirasiStats = async function () {
  const Aspirasi = mongoose.model("Aspirasi");

  const [diterima, diproses, ditolak, disetujui] = await Promise.all([
    Aspirasi.countDocuments({ status: "pending" }),
    Aspirasi.countDocuments({ status: "diproses" }),
    Aspirasi.countDocuments({ status: "ditolak" }),
    Aspirasi.countDocuments({ status: "disetujui" }),
  ]);

  // Return sebagai AspirasiHelper value object
  return {
    jumlahAspirasiDiterima: diterima,
    jumlahAspirasiDiproses: diproses,
    jumlahAspirasiDitolak: ditolak,
    jumlahAspirasiDisetujui: disetujui,
  };
};

// Method: getRecentActivities
DashboardSchema.methods.getRecentActivities = async function () {
  const Aspirasi = mongoose.model("Aspirasi");
  const Claim = mongoose.model("Claim");

  const recentAspirasi = await Aspirasi.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select("judul status createdAt");

  const recentClaim = await Claim.find({})
    .sort({ tanggal: -1 })
    .limit(5)
    .select("barangId status tanggal");

  return [
    ...recentAspirasi.map((a) => `Aspirasi: ${a.judul} - ${a.status}`),
    ...recentClaim.map((c) => `Claim barang - ${c.status}`),
  ];
};

// Method: getLostFoundStats
DashboardSchema.methods.getLostFoundStats = async function () {
  const Barang = mongoose.model("Barang");
  const barang = await Barang.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return barang.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

// Method: refreshDashboard - update semua counter
DashboardSchema.methods.refreshDashboard = async function () {
  const Barang = mongoose.model("Barang");
  const Claim = mongoose.model("Claim");
  const Aspirasi = mongoose.model("Aspirasi");

  this.totalBarangTemuan = await Barang.countDocuments({});
  this.claimRequestCount = await Claim.countDocuments({ status: "pending" });
  this.totalAspirasi = await Aspirasi.countDocuments({});
  this.totalBarangDikembalikan = await Claim.countDocuments({
    status: "selesai",
  });
  this.lastUpdate = new Date();

  await this.save();
  return this;
};

module.exports = mongoose.model("Dashboard", DashboardSchema);

// DELETE /api/dashboard/notifikasi/:id
router.delete("/notifikasi/:id", deleteNotif);