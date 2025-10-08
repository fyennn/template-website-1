import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";

const PORT = Number.parseInt(process.env.PORT ?? "5000", 10);
const MONGO_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/spm-cafe";

async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.warn("MongoDB connection failed:", error);
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Bootstrap failed", error);
  process.exit(1);
});
