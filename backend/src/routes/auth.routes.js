import express from "express";
import authenticate from "../middlewares/auth.middleware.js";

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

router.post("/register" , register);
router.post("/login" , login);
router.post("/refresh" , refresh);
router.post("/logout" , logout);
router.get("/me" , authenticate , me);


router.get("/google" , googleLogin);
router.get("/google/callback" , googleCallback);

export default router;
