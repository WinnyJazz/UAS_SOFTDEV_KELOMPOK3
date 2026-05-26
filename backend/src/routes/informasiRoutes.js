const express = require("express");
const router = express.Router();
const {
  getAllInformasi,
  getInformasiById,   
  createInformasi,
  updateInformasi,    
  deleteInformasi,
} = require("../controllers/informasiController");

// Publik
router.get("/", getAllInformasi);
router.get("/:id", getInformasiById);   

// Admin
router.post("/", createInformasi);
router.put("/:id", updateInformasi);    
router.delete("/:id", deleteInformasi);

module.exports = router;