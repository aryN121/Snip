import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import urlRoutes from "./routes/url.routes.js";
import { env } from "./config/env.js";
import { redirect } from "./controllers/url.controlller.js";




const app  = express();
const { BASE_URL } = env;


// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true                
}));
app.use(express.json());
app.use(cookieParser());





// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────


// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// POST /api/auth/register
app.use("/api/auth", authRoutes);
app.use("/api", urlRoutes);

app.get("/:code", redirect);

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

export default app;