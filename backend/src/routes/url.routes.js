import express from "express";
import authenticate from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../middlewares/rateLimit.middleware.js";

import {
    shorten,
    getUrls,
    getStats,
    deleteUrl,
    redirect
} from "../controllers/url.controlller.js";
const router = express.Router();


// router.post("/shorten" , authenticate , shorten);
router.post(
    "/shorten",
    authenticate,
    rateLimiter({
        limit: 100,
        window: 60 * 60,
        keyGenerator: req => `create-url:${req.user.id}`,
    }),
    shorten
);
router.get("/urls" , authenticate , getUrls);
router.get("/urls/:code/stats", authenticate , getStats);
router.delete("/urls/:code", authenticate , deleteUrl);

export default router;