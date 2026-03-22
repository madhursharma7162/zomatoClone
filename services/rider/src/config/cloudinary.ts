// config/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const CLOUD_NAME: string = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY: string = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET: string = process.env.CLOUDINARY_API_SECRET || "";

if (!CLOUD_NAME) throw new Error("CLOUDINARY_CLOUD_NAME is missing in .env");

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export default cloudinary;