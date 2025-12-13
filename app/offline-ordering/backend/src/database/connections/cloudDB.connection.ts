import mongoose from "mongoose";

const uri = process.env.CLOUD_MONGO_URI;
if (!uri) throw new Error("CLOUD_MONGO_URI missing");

export const cloudDB = mongoose.createConnection(uri);

cloudDB.on("connected", () => console.log("Cloud DB connected"));
cloudDB.on("error", (err) => console.error("Cloud DB Error:", err));
