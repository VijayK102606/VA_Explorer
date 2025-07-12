const File = require('../models/File');

exports.uploadFile = async(req, res) => {
    try {
        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).send("No file uploaded");
        }

        console.log(req.file);

        const newFile = new File({
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            data: req.file.buffer
        });

        await newFile.save();

        console.log("File saved to mongo");

        res.status(201).json({
            message: "File uploaded to MongoDB", 
            fileID: newFile._id
        });
    } catch (error) {
        console.log("Uplaod failed");
        res.status(500).json({
            message: "server error",
            error: error.message
        });
    }
};
