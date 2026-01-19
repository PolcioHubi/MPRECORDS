const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const type = req.params.type || 'media';
        cb(null, `server/uploads/${type}/`);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter - images and audio
const fileFilter = (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const audioTypes = /mp3|wav|ogg|m4a|aac/;
    const audioMimeTypes = /audio\//;
    
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    // Check images
    if (imageTypes.test(ext) && file.mimetype.startsWith('image/')) {
        return cb(null, true);
    }
    
    // Check audio
    if (audioTypes.test(ext) || audioMimeTypes.test(file.mimetype)) {
        return cb(null, true);
    }
    
    cb(new Error('Dozwolone są tylko pliki graficzne i audio!'), false);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for audio
    },
    fileFilter: fileFilter
});

module.exports = upload;
