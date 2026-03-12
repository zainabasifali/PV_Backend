const cloudinary = require("cloudinary").v2;

const getSignedUrl = (fileUrl, expiresIn = 3600) => {
    if (!fileUrl) return null;

    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/'); // ['', 'raw', 'upload', 'v1773...', 'pharmacy_uploads/filename.pdf']
    const versionIndex = pathParts.findIndex(p => p.startsWith('v'));
    const publicIdParts = pathParts.slice(versionIndex + 1); 
    const publicId = publicIdParts.join('/'); // pharmacy_uploads/filename.pdf

    return cloudinary.url(publicId, {
        resource_type: "raw",
        type: "authenticated",
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
};

module.exports = { getSignedUrl };