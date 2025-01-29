import mongoose from "mongoose";
import { config } from "./app.config";

export async function connectDB() {
  try {
    const { connection } = await mongoose.connect(config.MONGODB_URI);
    console.log(`connected to db ${connection.host}`);
  } catch (error) {
    console.log(error);
    console.log("Error connecting to the database");
    process.exit(1);
  }
}
