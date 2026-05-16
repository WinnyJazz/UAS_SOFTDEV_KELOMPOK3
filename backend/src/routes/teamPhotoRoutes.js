const express    = require('express');
const multer     = require('multer');
const router     = express.Router();

const { getAllPhotos, uploadPhoto, deletePhoto } = require('../controllers/teamPhotoController');
const { verifySuperAdmin }                       = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // maks 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Hanya file gambar yang diperbolehkan.'));
  },
});

// GET  /api/team-photos — publik, semua user bisa akses
router.get('/', getAllPhotos);

// POST /api/team-photos — superadmin only
router.post('/', verifySuperAdmin, upload.single('file'), uploadPhoto);

// DELETE /api/team-photos/:id — superadmin only
router.delete('/:id', verifySuperAdmin, deletePhoto);

module.exports = router;