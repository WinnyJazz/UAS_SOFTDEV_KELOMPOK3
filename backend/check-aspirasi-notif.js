const mongoose = require('mongoose');
const { HasilRespons, SesiAspirasi } = require('./src/models/Aspirasi');
const Notifikasi = require('./src/models/Notifikasi');

mongoose.connect('mongodb+srv://kelompok3softdev_db_user:rNANBB1Ns9N3CqX0@cluster0.tvpruf9.mongodb.net/?appName=Cluster0')
  .then(async () => {
    console.log('✅ MongoDB connected\n');
    
    // Check aspirasi terbaru
    const recentAspirasi = await HasilRespons.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    console.log('📋 ASPIRASI TERBARU:');
    if (recentAspirasi.length === 0) {
      console.log('   (Tidak ada aspirasi)');
    } else {
      recentAspirasi.forEach(a => {
        console.log(`   - ${a.createdAt.toLocaleString()}: sesiId=${a.sesiId}, userId=${a.userId}`);
      });
    }
    
    console.log('');
    
    // Check notifikasi aspirasi terbaru
    const recentNotifs = await Notifikasi.find({ category: 'Aspirasi' })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    console.log('🔔 NOTIFIKASI ASPIRASI TERBARU:');
    if (recentNotifs.length === 0) {
      console.log('   (Tidak ada notifikasi aspirasi)');
    } else {
      recentNotifs.forEach(n => {
        console.log(`   - ${n.createdAt.toLocaleString()}: ${n.title}`);
        console.log(`     desc: ${n.desc}`);
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
