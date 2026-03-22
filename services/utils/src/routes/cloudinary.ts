import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload_stream(
      {
        folder: "rider_profiles",
        upload_preset: "rider_profiles_unsigned",
      },
      (error, result) => {
        if (error) return res.status(500).json({ message: "Upload failed", error });
        res.json({ url: result?.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

export default router;