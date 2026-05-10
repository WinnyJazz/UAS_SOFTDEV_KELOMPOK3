const express = require("express");
const router = express.Router();
const {
  getAllBarang,
  getBarangById,
  createBarang,
  updateBarang,
  deleteBarang,
  markDone,
} = require("../controllers/barangController");

const { verifyAdminOrSuperAdmin } = require("../middleware/authMiddleware");

// Public (atau bisa ditambah verifyToken kalau mau)
router.get("/", getAllBarang);
router.get("/:id", getBarangById);

// Admin only
router.post("/", verifyAdminOrSuperAdmin, createBarang);
router.put("/:id", verifyAdminOrSuperAdmin, updateBarang);
router.delete("/:id", verifyAdminOrSuperAdmin, deleteBarang);
router.patch("/:id/done", verifyAdminOrSuperAdmin, markDone);

module.exports = router;
