"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.get("/reverse", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon)
        return res.status(400).json({ message: "lat & lon required" });
    try {
        const response = await axios_1.default.get("https://nominatim.openstreetmap.org/reverse", {
            params: { format: "json", lat, lon },
            headers: { "User-Agent": "Zomato-Clone-App" } // Required by OSM
        });
        res.json(response.data);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Failed to fetch location", error: err.message });
    }
});
exports.default = router;
