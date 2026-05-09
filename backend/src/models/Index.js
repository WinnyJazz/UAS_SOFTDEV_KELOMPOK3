const Mahasiswa = require("./Mahasiswa");
const Admin = require("./Admin");
const Barang = require("./Barang");
const Claim = require("./Claim");
const Aspirasi = require("./Aspirasi");
const Notifikasi = require("./Notifikasi");
const Informasi = require("./Informasi");
const Dashboard = require("./Dashboard");
const AspirasiHelper = require("./AspirasiHelper");

module.exports = {
  Mahasiswa,
  Admin,
  Barang,
  Claim,
  Aspirasi,
  Notifikasi,
  Informasi,
  Dashboard,
  AspirasiHelper, // Value Object, bukan Mongoose model
};