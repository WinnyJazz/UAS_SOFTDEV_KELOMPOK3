// models/Admin.js
const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Methods sesuai class diagram
AdminSchema.methods.createInformasi = async function ({ judul, isi, media, kategori }) {
  const Informasi = mongoose.model("Informasi");
  return await Informasi.create({
    adminId: this.adminId,
    judul,
    isi,
    // media = Firebase Storage URL (foto/video)
    media,
    kategori,
  });
};

AdminSchema.methods.updateInformasi = async function (id, { judul, isi }) {
  const Informasi = mongoose.model("Informasi");
  return await Informasi.findByIdAndUpdate(id, { judul, isi }, { new: true });
};

AdminSchema.methods.deleteInformasi = async function (id) {
  const Informasi = mongoose.model("Informasi");
  return await Informasi.findByIdAndDelete(id);
};

AdminSchema.methods.updateStatusAspirasi = async function (idAspirasi, status) {
  const Aspirasi = mongoose.model("Aspirasi");
  return await Aspirasi.findByIdAndUpdate(
    idAspirasi,
    { status },
    { new: true }
  );
};

AdminSchema.methods.tambahBarang = async function ({
  nama,
  deskripsi,
  lokasi,
  kategori,
  foto, // Firebase Storage URL
}) {
  const Barang = mongoose.model("Barang");
  return await Barang.create({
    nama,
    deskripsi,
    lokasi,
    kategori,
    foto,
    status: "tersedia",
  });
};

AdminSchema.methods.updateStatusBarang = async function (idBarang, status) {
  const Barang = mongoose.model("Barang");
  return await Barang.findByIdAndUpdate(idBarang, { status }, { new: true });
};

AdminSchema.methods.deleteBarang = async function (idBarang) {
  const Barang = mongoose.model("Barang");
  return await Barang.findByIdAndDelete(idBarang);
};

AdminSchema.methods.getAllAspirasi = async function () {
  const Aspirasi = mongoose.model("Aspirasi");
  return await Aspirasi.find({});
};

module.exports = mongoose.model("Admin", AdminSchema);