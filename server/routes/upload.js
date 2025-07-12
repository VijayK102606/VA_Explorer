// user input endpoint
// url is now /api/upload
const express = require('express');
const router = express.Router();
const upload = require('../middleware/multerConfig');
const { uploadFile } = require('../controllers/uploadController');

router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;