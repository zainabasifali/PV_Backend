const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isPdf = ["application/pdf", "application/x-pdf"].includes(file.mimetype.toLowerCase());
        return {
            folder: "pharmacy_uploads",
            allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"],
            resource_type: isPdf ? "image" : "image",
            public_id: Date.now() + "-" + file.originalname,
        };
    },
});

module.exports = { cloudinary, storage };