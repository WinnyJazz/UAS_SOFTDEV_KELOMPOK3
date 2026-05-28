require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Informasi = require('../models/Informasi');
const connectDB = require('../config/db');

const isBase64 = (str) => {
  return typeof str === 'string' && str.startsWith('data:image/');
};

const uploadBase64ToCloudinary = (base64String, folder = 'informasi') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64String,
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
  });
};

const migrate = async () => {
  await connectDB();
  console.log('✅ Terhubung ke database');

  const allInfo = await Informasi.find({});
  console.log(`📦 Total data ditemukan: ${allInfo.length}`);

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalError = 0;

  for (const info of allInfo) {
    const id = info.informasiId || info._id;
    const mediaArr = Array.isArray(info.media) ? info.media : [];

    // Cek apakah ada yang masih base64
    const hasBase64 = mediaArr.some(isBase64);
    if (!hasBase64) {
      console.log(`⏭️  Skip [${id}] "${info.judul}" — semua sudah Cloudinary`);
      totalSkipped++;
      continue;
    }

    console.log(`🔄 Migrasi [${id}] "${info.judul}" (${mediaArr.length} foto)...`);

    const newMedia = [];
    for (let i = 0; i < mediaArr.length; i++) {
      const url = mediaArr[i];
      if (isBase64(url)) {
        try {
          const cloudUrl = await uploadBase64ToCloudinary(url);
          newMedia.push(cloudUrl);
          console.log(`   ✅ Foto ${i + 1} → ${cloudUrl}`);
        } catch (err) {
          console.error(`   ❌ Foto ${i + 1} gagal upload:`, err.message);
          newMedia.push(url); // tetap simpan yang lama kalau gagal
          totalError++;
        }
      } else {
        // Sudah URL Cloudinary, pertahankan
        newMedia.push(url);
      }
    }

    await Informasi.findByIdAndUpdate(info._id, { media: newMedia });
    console.log(`   💾 Tersimpan\n`);
    totalMigrated++;
  }

  console.log('─────────────────────────────────');
  console.log(`✅ Berhasil dimigrasi : ${totalMigrated}`);
  console.log(`⏭️  Di-skip            : ${totalSkipped}`);
  console.log(`❌ Error              : ${totalError}`);
  console.log('─────────────────────────────────');

  await mongoose.disconnect();
  console.log('🔌 Koneksi database ditutup');
  process.exit(0);
};

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});