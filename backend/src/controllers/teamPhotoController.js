const cloudinary = require('../config/cloudinary');
const TeamPhoto = require('../models/TeamPhoto');

// GET all photos (public)
// GET /api/team-photos
const getAllPhotos = async (req, res) => {
    try {
        const photos = await TeamPhoto.find().sort({ division: 1, order: 1, createdAt: 1 });
        res.json({ success: true, data: photos });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data foto.' });
    }
};

// UPLOAD photo (superadmin only) 
// POST /api/team-photos
// body: multipart/form-data  { division, name, file }
const uploadPhoto = async (req, res) => {
    try {
        const { division, name } = req.body;

        // Validasi division
        const allowed = ['group', 'bphi', 'komisi1', 'komisi2', 'komisi3', 'komisi4'];
        if (!allowed.includes(division)) {
            return res.status(400).json({ success: false, message: 'Division tidak valid.' });
        }

        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: 'Nama tidak boleh kosong.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File foto tidak ditemukan.' });
        }

        // Kalau division = group, hapus foto grup lama dulu (hanya 1 foto grup)
        if (division === 'group') {
            const existing = await TeamPhoto.findOne({ division: 'group' });
            if (existing) {
                await cloudinary.uploader.destroy(existing.cloudinaryPublicId);
                await TeamPhoto.deleteOne({ _id: existing._id });
            }
        }

        // Upload ke Cloudinary via buffer (pakai multer memoryStorage)
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'dpm-fti/team',
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Simpan ke MongoDB
        const photo = await TeamPhoto.create({
            division,
            name: name.trim(),
            imageUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            uploadedBy: req.user.adminId || req.user.userId,
        });

        res.status(201).json({ success: true, data: photo });
    } catch (err) {
        console.error('uploadPhoto error:', err);
        res.status(500).json({ success: false, message: 'Gagal upload foto.' });
    }
};

// DELETE photo (superadmin only) 
// DELETE /api/team-photos/:id
const deletePhoto = async (req, res) => {
    try {
        const photo = await TeamPhoto.findById(req.params.id);
        if (!photo) {
            return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
        }

        // Hapus dari Cloudinary
        await cloudinary.uploader.destroy(photo.cloudinaryPublicId);

        // Hapus dari MongoDB
        await TeamPhoto.deleteOne({ _id: photo._id });

        res.json({ success: true, message: 'Foto berhasil dihapus.' });
    } catch (err) {
        console.error('deletePhoto error:', err);
        res.status(500).json({ success: false, message: 'Gagal menghapus foto.' });
    }
};

module.exports = { getAllPhotos, uploadPhoto, deletePhoto };