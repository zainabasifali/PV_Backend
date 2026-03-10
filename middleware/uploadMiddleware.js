const multer = require("multer");
const { storage } = require("../config/cloudinary");

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedPdfTypes = ["application/pdf", "application/x-pdf"];

    if (allowedImageTypes.includes(file.mimetype.toLowerCase()) || allowedPdfTypes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png, webp) and PDF files are allowed"));
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;