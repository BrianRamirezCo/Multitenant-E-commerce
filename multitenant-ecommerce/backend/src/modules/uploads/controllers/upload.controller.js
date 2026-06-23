const { uploadImage, isConfigured } = require("../../../services/cloudinary");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");

/**
 * Image upload controller. Receives an image (via multer memory storage) and
 * uploads it to Cloudinary under the current tenant's folder, then returns the
 * URL for the frontend to save (on the tenant logo, a product, etc.).
 *
 * Admin-only. The file never hits disk — it streams from memory to Cloudinary.
 */

// POST /uploads  -> upload one image, returns its URL
exports.uploadOne = catchAsync(async (req, res, next) => {
  if (!isConfigured()) {
    return next(
      new AppError("Image uploads are not configured on the server.", 503),
    );
  }

  if (!req.file) {
    return next(new AppError("No image file provided.", 400));
  }

  // Optional "kind" to organize uploads (e.g. 'logo' or 'product'). Defaults to misc.
  const kind = ["logo", "product"].includes(req.body.kind)
    ? req.body.kind
    : "misc";

  // Per-tenant folder so stores never mix: tiendas/<slug>/<kind>
  const folder = `tiendas/${req.tenant.slug}/${kind}`;

  try {
    const { url, publicId } = await uploadImage(req.file.buffer, folder);
    res.status(201).json({ status: "success", url, publicId });
  } catch (err) {
    return next(new AppError("Could not upload the image. Try again.", 502));
  }
});
