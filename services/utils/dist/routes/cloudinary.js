"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = express_1.default.Router();
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ message: "No file uploaded" });
        const result = await cloudinary_1.v2.uploader.upload_stream({
            folder: "rider_profiles",
            upload_preset: "rider_profiles_unsigned",
        }, (error, result) => {
            if (error)
                return res.status(500).json({ message: "Upload failed", error });
            res.json({ url: result?.secure_url });
        }).end(req.file.buffer);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
});
exports.default = router;
