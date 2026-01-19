const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadFile, uploadMultiple } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/upload
// @desc    Upload single file (folder from body.folder)
// @access  Private
router.post('/', protect, upload.single('file'), uploadFile);

// @route   POST /api/upload/:type
// @desc    Upload single file
// @access  Private
router.post('/:type', protect, upload.single('file'), uploadFile);

// @route   POST /api/upload/:type/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/:type/multiple', protect, upload.array('files', 10), uploadMultiple);

module.exports = router;
