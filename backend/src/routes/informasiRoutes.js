const express = require("express");
const router = express.Router();
const {
  getAllInformasi,
  getInformasiById,
  createInformasi,
  updateInformasi,
  deleteInformasi,
  upload,
} = require("../controllers/informasiController");

// Publik
router.get("/", getAllInformasi);
router.get("/:id", getInformasiById);

// Admin
router.post("/", upload.array("media", 10), createInformasi);
router.put("/:id", upload.array("media", 10), updateInformasi);
router.delete("/:id", deleteInformasi);

module.exports = router;