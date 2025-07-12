const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: String,
    mimetype: String,
    size: Number,
    data: Buffer,
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model("File", fileSchema, "VA_Explorer.files");