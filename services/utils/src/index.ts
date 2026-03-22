import express from 'express';
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import uploadRoutes from './routes/cloudinary.js';
import paymentRoutes from './routes/payment.js';
import { connectRabbitMQ } from './config/rabbitmq.js';


console.log("Server time:", new Date().toISOString());
console.log("Unix timestamp:", Math.floor(Date.now() / 1000));


dotenv.config();
connectRabbitMQ();

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



app.use(express.json({ limit: "50mb"}));
app.use(express.urlencoded({ limit: "50mb", extended:true}));

const { CLOUD_NAME , CLOUD_API_KEY , CLOUD_SECRET_KEY} = process.env;

if(!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY){
    throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_SECRET_KEY,
});

app.use("/api", uploadRoutes);
app.use("/api/payment", paymentRoutes);

const PORT = Number(process.env.PORT) || 5002;


app.listen(PORT, "0.0.0.0", () => {
    console.log(`Utils service is running on port ${PORT}`);

});