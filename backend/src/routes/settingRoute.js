const express = require('express');
const router = express.Router();
const { getVideoUrl, setVideoUrl } = require('../controllers/settingController');
const { verifySuperAdmin } = require('../middleware/authMiddleware');

router.get('/video-url', getVideoUrl);
router.post('/video-url', verifySuperAdmin, setVideoUrl);

module.exports = router;