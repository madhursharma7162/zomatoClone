


import express from "express";
import { getIO } from "../socket.js";

const router = express.Router();

router.post("/emit", (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { event, room, payload } = req.body;

    console.log("📡 Emit request received:", { event, room, payload });

    const io = getIO();

    if (room) {
      io.to(room).emit(event, payload);
      console.log(`✅ Emitted to room: ${room}`);
    } else {
      io.emit(event, payload);
      console.log(`✅ Emitted globally`);
    }

    res.json({ success: true });
  } catch (error) {
    console.log("❌ Emit error:", error);
    res.status(500).json({ success: false });
  }
});

export default router;