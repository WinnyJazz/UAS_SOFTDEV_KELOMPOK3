const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://kelompok3softdev_db_user:rNANBB1Ns9N3CqX0@cluster0.tvpruf9.mongodb.net/?appName=Cluster0')
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Direct insert to collection
    const db = mongoose.connection.db;
    const result = await db.collection('notifikasis').insertOne({
      notifId: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: 'Test Notifikasi Frontend',
      desc: 'Ini adalah notifikasi test untuk cek apakah frontend bisa fetch data',
      category: 'Sistem',
      icon: '✅',
      iconBg: '#e0e7ff',
      target: 'admin',
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Test notifikasi berhasil dibuat!');
    console.log('   _id:', result.insertedId);
    console.log('   Collection: notifikasis');
    console.log('\n   🎯 Sekarang buka frontend admin notifikasi page dan klik Refresh button');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
