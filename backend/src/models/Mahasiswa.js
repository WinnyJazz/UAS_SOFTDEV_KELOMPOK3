const mongoose = require("mongoose");
const NotifiablePlugin = require("./Notifiable");

const MahasiswaSchema = new mongoose.Schema(
  {
    userId: {
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
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    nim: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      default: "mahasiswa",
      enum: ["mahasiswa"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // handle manual via createdAt
    versionKey: false,
  }
);

MahasiswaSchema.plugin(NotifiablePlugin);

MahasiswaSchema.methods.login = async function (email, nim, password) {
  return this;
};

MahasiswaSchema.methods.register = async function (
  nama,
  nim,
  email,
  password
) {
  return this;
};

MahasiswaSchema.methods.logout = function () {

};

MahasiswaSchema.methods.getAllInformasi = async function () {
  const Informasi = mongoose.model("Informasi");
  return await Informasi.find({});
};

MahasiswaSchema.methods.getAllBarang = async function () {
  const Barang = mongoose.model("Barang");
  return await Barang.find({});
};

MahasiswaSchema.methods.createAspirasi = async function ({
  judul,
  deskripsi,
  kategori,
  lampiran,
}) {
  const Aspirasi = mongoose.model("Aspirasi");
  return await Aspirasi.create({
    userId: this.userId,
    judul,
    deskripsi,
    kategori,
    lampiran, 
    status: "pending",
  });
};

MahasiswaSchema.methods.getPesanNotifikasi = function () {
  return `Notifikasi untuk mahasiswa: ${this.nama}`;
};

module.exports = mongoose.model("Mahasiswa", MahasiswaSchema);