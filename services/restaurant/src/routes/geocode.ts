import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ message: "lat & lon required" });

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { format: "json", lat, lon },
      headers: { "User-Agent": "Zomato-Clone-App" } // Required by OSM
    });

    res.json(response.data);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to fetch location", error: err.message });
  }
});

export default router;