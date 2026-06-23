const cloudinary = require("cloudinary").v2;
const logger = require("../config/logger");

/**
 * Cloudinary service. ONE platform-wide account serves ALL tenants; uploads are
 * organized into per-tenant folders so stores never mix.
 *
 * Credentials come from the env (never hardcode). If they're missing, uploads
 * fail cleanly with a clear message instead of crashing.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// True only when all three credentials are present.
function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Uploads an image buffer to Cloudinary under a tenant's folder.
 * @param {Buffer} buffer - the raw image bytes (from multer memory storage)
 * @param {string} folder - destination folder (e.g. "tiendas/store-a/logo")
 * @returns {Promise<{url: string, publicId: string}>}
 */
function uploadImage(buffer, folder) {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(new Error("Cloudinary is not configured on the server."));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Let Cloudinary optimize format/quality automatically.
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          logger.error(
            { err: error?.message, folder },
            "cloudinary upload failed",
          );
          return reject(error);
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

module.exports = { uploadImage, isConfigured };
