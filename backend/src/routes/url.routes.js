import express from "express";
import authenticate from "../middlewares/auth.middleware.js";

import {
    shorten,
    getUrls,
    getStats,
    deleteUrl,
    redirect
} from "../controllers/url.controlller.js";
const router = express.Router();


router.post("/shorten" , authenticate , shorten);
router.get("/urls" , authenticate , getUrls);
router.get("/urls/:code/stats", authenticate , getStats);
router.delete("/urls/:code", authenticate , deleteUrl);
router.get("/:code" , redirect);

export default router;