import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import urlRoutes from "./routes/url.routes.js";
import { env } from "./config/env.js";

const app  = express();

const { BASE_URL } = env;

// ─── ENV / SECRETS ────────────────────────────────────────────────────────────
// Put these in a real .env file in production!


// ─── DATABASE ────────────────────────────────────────────────────────────────


// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: BASE_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "../frontend")));

// Clean up expired refresh tokens every hour
// setInterval(() => q.cleanExpiredTokens.run(), 60 * 60 * 1000);

// ─── validators ─────────────────────────────────────────────────────────────────

// jwt 



// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────


// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// POST /api/auth/register
app.use("/api/auth", authRoutes);
app.use("/api", urlRoutes);


// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ─── START ────────────────────────────────────────────────────────────────────
// app.listen(PORT, () => {
//   console.log(`\n🔗 SNIP running at http://localhost:${PORT}`);
//   if (!GOOGLE_CLIENT_ID) console.log("⚠️  Google OAuth disabled — set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to enable\n");
//   else console.log("✅  Google OAuth enabled\n");
// });

export default app;