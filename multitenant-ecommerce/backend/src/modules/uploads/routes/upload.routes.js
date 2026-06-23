const express = require("express");
const multer = require("multer");
const ctrl = require("../controllers/upload.controller");
const { protect, restrictTo } = require("../../auth/middlewares/auth");

const router = express.Router();

/**
 * Multer config: keep the file in MEMORY (not disk), since we stream it straight
 * to Cloudinary. Limit size and accept images only.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

/**
 * POST /uploads  -> upload one image (field name: "image"). Admin only.
 * The multer middleware parses the multipart body and puts the file on req.file.
 */
router.post(
  "/",
  protect,
  restrictTo("admin"),
  upload.single("image"),
  ctrl.uploadOne,
);

module.exports = router;
