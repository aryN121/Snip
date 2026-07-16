// auth middleware
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET);
    next();
  } catch (e) {
    const msg = e.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    res.status(401).json({ error: msg });
  }
}

export default authenticate;