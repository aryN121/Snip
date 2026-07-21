import express from "express";
import authenticate from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../middlewares/rateLimit.middleware.js";

import {
    register,
    login,
    refresh,
    logout,
    me,
    googleLogin,
    googleCallback
} from "../controllers/auth.controller.js";


const router = express.Router();

router.post(
    "/register",
    rateLimiter({
        limit: 3,
        window: 60 * 60,
        keyGenerator: req => `register:${req.ip}`,
    }),
    register
);
router.post(
    "/login",
    rateLimiter({
        limit: 5,
        window: 15 * 60,
        keyGenerator: req => `login:${req.ip}`,
    }),
    login
);
// router.post("/refresh" , refresh);
router.post(
    "/refresh",
    rateLimiter({
        limit: 60,
        window: 60,
        keyGenerator: req => `refresh:${req.ip}`,
    }),
    refresh
);
router.post("/logout" , logout);
router.get("/me" , authenticate , me);


router.get("/google" , googleLogin);
router.get("/google/callback" , googleCallback);

export default router;
