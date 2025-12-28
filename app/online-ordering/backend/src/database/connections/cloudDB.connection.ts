import mongoose, { Connection, ConnectOptions } from "mongoose";

const uri = process.env.CLOUD_MONGO_URI;
if (!uri) {
  throw new Error("CLOUD_MONGO_URI is not defined in environment variables");
}

const options: ConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: "majority",
};
const cloudDB: Connection = mongoose.createConnection(uri, options);

// Connection events
// cloudDB.on("connected", () => {
//   console.log("✅ Cloud MongoDB connected successfully");
// });

// cloudDB.on("error", (err) => {
//   console.error("❌ Cloud MongoDB connection error:", err);
// });

// cloudDB.on("disconnected", () => {
//   console.log("ℹ️  Cloud MongoDB disconnected");
// });

// Close the connection when the Node process ends
// process.on("SIGINT", async () => {
//   try {
//     await cloudDB.close();
//     console.log("ℹ️  Cloud MongoDB connection closed through app termination");
//     process.exit(0);
//   } catch (err) {
//     console.error("Error closing Cloud MongoDB connection:", err);
//     process.exit(1);
//   }
// });
export default cloudDB;
