import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuitems.js";
import cors from 'cors';
import geocodeRoutes from "./routes/geocode.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"] 
  })
);
app.options(/.*/, cors());

app.use(express.json());


const PORT = Number(process.env.PORT) || 5001;

app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/geocode", geocodeRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Restaurant service is running on port ${PORT}`);
  connectDB();
});
