import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import "./src/config/redis.js";

const PORT = process.env.PORT || 3001;



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});