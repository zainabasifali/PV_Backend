const { cloudinary } = require("../config/cloudinary");

const getSignedUrl = (publicId) => {
    if (!publicId) return null;
    return cloudinary.url(publicId, {
        resource_type: "raw",
        type: "authenticated",
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    });
};

module.exports = { getSignedUrl };