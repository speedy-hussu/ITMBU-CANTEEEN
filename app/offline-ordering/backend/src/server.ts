import "dotenv/config";
import { buildApp } from "./app";
import connectDB from "./database/connections/localDB.connection";
connectDB();

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: PORT, host: HOST });

    console.log(`
════════════════════════════════════════════════════════
   🚀 Server Started Successfully                       
   📍 URL:  http://localhost:${PORT}                     
   🌐 Host: ${HOST}                                     
   🔧 Mode: LOCAL                                            
   📊 Environment: development                                                                   
════════════════════════════════════════════════════════
    `);

    // Handle graceful shutdown
    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n🛑 ${signal} received, closing server...`);
        await app.close();
        console.log("✅ Server closed gracefully");
        process.exit(0);
      });
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
}

start();
