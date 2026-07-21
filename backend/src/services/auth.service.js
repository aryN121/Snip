import bcrypt from "bcrypt";
import {
  makeAccessToken,
  makeRefreshToken,
} from "../utils/jwt.js";
import { isValidEmail } from "../utils/validators.js";
import * as repo from "../repositories/auth.respository.js"

import { env } from "../config/env.js";
import { hashToken } from "../utils/hash.js";


export const registerUser = async ({ email, password, name }) => {
    if (!email || !isValidEmail(email)) {
        throw new Error("Valid email required");
    }

    if (!password || password.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }

    if (!name || name.trim().length < 2) {
        throw new Error("Name must be at least 2 characters");
    }

    email = email.toLowerCase().trim();

    const existing = await repo.findUserByEmail(email);

    if (existing) {
        throw new Error("Email already registered");
    }

    const hash = await bcrypt.hash(password, 12);

    const info = await repo.createUser({
        email,
        passwordHash: hash,
        name: name.trim(),
        provider: "local",
    });

    const user = {
        id: info.id,
        email,
        name: name.trim(),
    };

    const refreshToken = makeRefreshToken(user.id);

    return {
        user,
        accessToken: makeAccessToken(user),
        refreshToken,
    };
};
export const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and password required");
    }

    const user = await repo.findUserByEmail(email.toLowerCase());

    if (!user || user.provider !== "local") {
        throw new Error("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    if (!ok) {
        throw new Error("Invalid credentials");
    }
    const refreshToken = await makeRefreshToken(user.id);
    return {
        user,
        accessToken: makeAccessToken(user),
        refreshToken,
    };
};

export const refreshUserToken = async (token) => {
    if (!token) {
        throw new Error("No refresh token");
    }

    // const hash = Buffer.from(token).toString("base64");
    const hash = hashToken(token);

    const stored = await repo.findRefreshToken(hash);

    if (!stored || new Date(stored.expiresAt) < new Date()) {
        await repo.deleteRefreshToken(hash);
        throw new Error("Refresh token expired or invalid");
    }

    const user = await repo.findUserById(stored.userId);

    if (!user) {
        throw new Error("User not found");
    }

    await repo.deleteRefreshToken(hash);

    const refreshToken = await makeRefreshToken(user.id);

    return {
        user,
        accessToken: makeAccessToken(user),
        refreshToken,
    };
};
export const logoutUser = async (token) => {
    if (!token) return;

    // const hash = Buffer.from(token).toString("base64");
    const hash = hashToken(token);

    await repo.deleteRefreshToken(hash);
};

export const getCurrentUser = async (userId) => {
    const user = await repo.findUserById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const getGoogleAuthUrl = ()=>{
    if (!env.GOOGLE_CLIENT_ID) {
        throw new Error("Google OAuth not configured");
    }

    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${env.BASE_URL}/api/auth/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export const loginWithGoogle = async (code) => {
    


    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${env.BASE_URL}/api/auth/google/callback`,
        grant_type:    "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.id_token) throw new Error("No id_token");

    // Decode Google's ID token (we trust Google signed it)
    const payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
        let user = await repo.findUserByGoogle(googleId);
    if (!user) {
      const byEmail = await repo.findUserByEmail(email);
      if (byEmail) {
        // Link Google to existing local account
        await repo.updateGoogleUser(googleId, picture, email);
        user = await repo.findUserByEmail(email);
      } else {
        const info = await repo.createOAuthUser(email, name, picture, googleId);
                user = await repo.findUserById(info.id);
      }
    }
    const refreshToken = await makeRefreshToken(user.id);
    return {
        user,
        accessToken: makeAccessToken(user),
        refreshToken,
    };
}