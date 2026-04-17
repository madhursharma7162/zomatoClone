import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ message: "lat & lon required" });

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { 
        format: "json", 
        lat, 
        lon,
        addressdetails: 1, // Ensures you get city/town/village breakdown
        zoom: 18 
      },
      headers: { "User-Agent": "Zomato-Clone-App-Student-Project" } 
    });

    res.json(response.data);
  } catch (err:any) {
    // 🔍 Log the specific status to the terminal
    if (err.response) {
      console.error(`OSM API Error: ${err.response.status} - ${err.response.statusText}`);
      
      // Forward the 429 specifically so the frontend knows to slow down
      return res.status(err.response.status).json({
        message: "External Map API error",
        error: err.response.data
      });
    }

    console.error("Geocode error:", err.message);
    res.status(500).json({ message: "Internal server error during geocoding" });
  }
});

export default router;