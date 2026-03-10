const multer = require("multer");
const { storage } = require("../config/cloudinary");

const fileFilter = (req, file, cb) => {
    const allowedImages = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedPdfs = ["application/pdf", "application/x-pdf"];

    if (allowedImages.includes(file.mimetype.toLowerCase()) || allowedPdfs.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png, webp) and PDFs are allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 },
});

module.exports = upload;