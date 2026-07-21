import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import prisma from "../config/prisma.js";
import { env } from "../config/env.js";
import { hashToken } from "./hash.js";


const ACCESS_TOKEN_TTL = "15m"; // access token lifetime
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function makeAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

async function makeRefreshToken(userId) {
  const token = nanoid(64);
  const hash = Buffer.from(token).toString("base64"); // simple base64-hash
  const expires = new Date(Date.now() + REFRESH_TTL_MS).toISOString();

  // store refresh token record (do not block caller)
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      expiresAt: new Date(expires),
      userId,
    },
  }).catch((err) => console.error("Failed to save refresh token:", err));

  return token;
}

function setRefreshCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TTL_MS,
    path: "/api/auth",
  });
}

export { makeAccessToken, makeRefreshToken, setRefreshCookie };