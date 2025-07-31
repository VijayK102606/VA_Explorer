const path = require('path');
const fs = require('fs');

exports.uploadFile = async(req, res) => {
    try {
        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).send("No file uploaded");
        }

        console.log(req.file);
        console.log("File saved to local directory");

        res.status(201).json({
            message: "File uploaded to local directory", 
            filePath: req.file.path,
            originalName: req.file.originalname,
            savedFilename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.log("Upload failed");
        res.status(500).json({
            message: "server error",
            error: error.message
        });
    }
};
