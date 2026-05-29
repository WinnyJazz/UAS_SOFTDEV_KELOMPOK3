const Setting = require('../models/Setting');

exports.getVideoUrl = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'video-url' });
    res.json({ success: true, data: setting?.value ?? null });
  } catch (_) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.setVideoUrl = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL diperlukan' });

    await Setting.findOneAndUpdate(
      { key: 'video-url' },
      { key: 'video-url', value: url },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (_) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};