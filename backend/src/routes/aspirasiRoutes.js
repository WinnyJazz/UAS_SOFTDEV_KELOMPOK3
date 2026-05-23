// routes/aspirasiRoutes.js
// Gabungan endpoint admin + user untuk fitur Aspirasi

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/aspirasiController");

// ── Middleware auth (aktifkan sesuai kebutuhan) ───────────────
// const { protect, isAdmin } = require("../middleware/authMiddleware");

/* ══════════════════════════════════════════
   TIMELINE  (admin: CRUD | user: GET only)
══════════════════════════════════════════ */
router.get("/timeline", ctrl.getTimeline);                          // PUBLIC  — user & admin
router.post("/timeline", /* protect, isAdmin, */ ctrl.createTimelineStep);
router.put("/timeline/:id", /* protect, isAdmin, */ ctrl.updateTimelineStep);
router.delete("/timeline/:id", /* protect, isAdmin, */ ctrl.deleteTimelineStep);

/* ══════════════════════════════════════════
   SESI  (admin: CRUD | user: GET only)
══════════════════════════════════════════ */
router.get("/sesi", ctrl.getAllSesi);                               // PUBLIC  — returns [{...sesi, pertanyaan:[]}]
router.post("/sesi", /* protect, isAdmin, */ ctrl.createSesi);
router.delete("/sesi/:id", /* protect, isAdmin, */ ctrl.deleteSesi);

/* ══════════════════════════════════════════
   SESI AKTIF  ← endpoint baru untuk user
   GET /api/aspirasi/sesi/aktif
   Mengembalikan sesi dengan bulan & tahun sekarang
   (fallback: sesi terakhir jika tidak ada yang cocok)
══════════════════════════════════════════ */
router.get("/sesi/aktif", ctrl.getSesiAktif);

/* ══════════════════════════════════════════
   PERTANYAAN  (admin: CRUD | user: via sesi)
══════════════════════════════════════════ */
router.post("/sesi/:sesiId/pertanyaan", /* protect, isAdmin, */ ctrl.addPertanyaan);
router.put("/pertanyaan/:id", /* protect, isAdmin, */ ctrl.updatePertanyaan);
router.delete("/pertanyaan/:id", /* protect, isAdmin, */ ctrl.deletePertanyaan);

/* ══════════════════════════════════════════
   JAWABAN MAHASISWA  (user: POST | admin: GET)
══════════════════════════════════════════ */
router.get("/jawaban", /* protect, isAdmin, */ ctrl.getJawaban);    // admin only
router.post("/jawaban", /* protect, */ ctrl.submitJawaban);         // user submit (bisa tambah protect jika login)

/* ══════════════════════════════════════════
   HASIL RESPONS DPM  (admin: CRUD | user: GET)
══════════════════════════════════════════ */
router.get("/hasil", ctrl.getAllHasil);                             // PUBLIC  — user & admin
router.post("/hasil", /* protect, isAdmin, */ ctrl.createHasil);
router.put("/hasil/:id", /* protect, isAdmin, */ ctrl.updateHasil);
router.delete("/hasil/:id", /* protect, isAdmin, */ ctrl.deleteHasil);

module.exports = router;