import express from "express";
import dotenv from "dotenv";
import adminRoutes from "./routes/admin.js";
import cors from "cors";
import { connectDb } from "./config/db.js"; // Import your connection logic

dotenv.config();

const app = express();

app.use(express.json());


app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-key'],
  credentials: true
}));




app.use("/api/v1", adminRoutes);

const PORT = Number(process.env.PORT) || 5006;


const startServer = async () => {
  try {
    await connectDb();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Admin service is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start Admin Service due to DB error:", err);
    process.exit(1); // Stop the process if DB fails
  }
};

startServer();
