import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import prisma from "./src/config/prisma.js";
import "./src/config/redis.js";

const PORT = process.env.PORT || 3001;



async function start() {
  try {
    await prisma.$connect();
    console.log("Postgres connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();