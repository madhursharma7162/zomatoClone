import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuitems.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import cors from 'cors';
import geocodeRoutes from "./routes/geocode.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPaymentConsumer } from "./config/payment.consumer.js";
dotenv.config();
await connectRabbitMQ();
startPaymentConsumer();
const app = express();
app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options(/.*/, cors());
app.use(express.json());
const PORT = Number(process.env.PORT) || 5001;
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Restaurant service is running on port ${PORT}`);
    connectDB();
});
