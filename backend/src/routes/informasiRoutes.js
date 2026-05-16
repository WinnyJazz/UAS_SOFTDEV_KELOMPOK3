const express = require("express");
const router = express.Router();
const { getAllInformasi, createInformasi, deleteInformasi } = require("../controllers/informasiController");

// Asumsi kamu punya middleware auth (kalau namanya beda, sesuaikan ya)
// const { verifyAdmin } = require("../middleware/authMiddleware");

// Route Publik
router.get("/", getAllInformasi);

// Route Admin (Uncomment verifyAdmin jika middleware sudah siap)
// router.post("/", verifyAdmin, createInformasi);
// router.delete("/:id", verifyAdmin, deleteInformasi);

// Sementara tanpa middleware agar kamu bisa test API-nya dulu:
router.post("/", createInformasi);
router.delete("/:id", deleteInformasi);

module.exports = router;