const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "pharmacy_uploads",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"],
        // resource_type: "auto" is important to handle both images and PDFs
        resource_type: "auto",
    },
});

module.exports = { cloudinary, storage };
