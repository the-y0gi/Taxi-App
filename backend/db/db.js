import dotenv from 'dotenv';
dotenv.config();

import mongoose from "mongoose";

export const connectToDB = () => {
  mongoose
    .connect(process.env.DB_CONNECTION)
    .then(() => console.log("✅ Database Connected"))
    .catch((err) => console.log("❌ DB Connection Error:", err));
};


