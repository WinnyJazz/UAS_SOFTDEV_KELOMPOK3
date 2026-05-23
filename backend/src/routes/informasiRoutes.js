const express = require("express");
const router = express.Router();
const {
  getAllInformasi,
  getInformasiById,   // ← tambah
  createInformasi,
  updateInformasi,    // ← tambah
  deleteInformasi,
} = require("../controllers/informasiController");

// Publik
router.get("/", getAllInformasi);
router.get("/:id", getInformasiById);   // ← tambah, untuk detail page

// Admin
router.post("/", createInformasi);
router.put("/:id", updateInformasi);    // ← tambah, untuk edit page
router.delete("/:id", deleteInformasi);

module.exports = router;