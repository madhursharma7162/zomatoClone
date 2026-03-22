import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

// 1. Initialize dotenv immediately
dotenv.config();

let client: MongoClient;
let db: Db;

export const connectDb = async (): Promise<Db> => {
  if (db) return db;

  // 2. Safety Check: If URI is missing, show a clear error
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is undefined. Check your .env file path.");
    process.exit(1); 
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.DB_NAME);

    console.log("✅ Admin service connected to mongodb");
    return db;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};