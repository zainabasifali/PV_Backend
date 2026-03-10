const multer = require("multer");
const { storage } = require("../config/cloudinary");

// Correct file filter
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedPdfType = "application/pdf";

    if (allowedImageTypes.includes(file.mimetype) || file.mimetype === allowedPdfType) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png, webp) and PDF files are allowed"));
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;