import { nanoid } from "nanoid";
import * as repo from "../repositories/url.repository.js";
import { isValidUrl, isValidSlug } from "../utils/validators.js";
import redis from "../config/redis.js";



export const createShortUrl = async ({ url, customSlug, userId, host }) => {
    if (!url || !isValidUrl(url)) {
        throw { status: 400, message: "Invalid or missing URL" };
    }

    let shortCode;

    if (customSlug) {
        if (!isValidSlug(customSlug)) {
            throw {
                status: 400,
                message:
                    "Slug must be 3 to 30 chars: letters, numbers, hyphens, underscores",
            };
        }

        const existingSlug = await repo.findByCode(customSlug);

        if (existingSlug) {
            throw { status: 409, message: "Slug already taken" };
        }

        shortCode = customSlug;
    } else {
        const existing = await repo.findByUrlAndUser(url, userId);

        if (existing) {
            return {
                    shortCode: existing.shortCode,
                    shortUrl: `${host}/${existing.shortCode}`,
                    original: existing.original,
                    clicks: existing.clicks,
                    createdAt: existing.createdAt,
                    reused: true,
                };
        }

        shortCode = nanoid(7);
    }

    await repo.create({
        userId,
        shortCode,
        originalUrl: url,
        customSlug: customSlug || null,
    });

    // invalidating the cache 
    await redis.del(`user:${userId}:urls`);
    return {
        shortCode,
        shortUrl: `${host}/${shortCode}`,
        original: url,
        clicks: 0,
        createdAt: new Date().toISOString(),
    };
};

export const getUserUrls = async ({ userId, search }) => {
    if(search){
        return repo.searchByUser(userId, search);
    }
    const key = `user:${userId}:urls`;

    const cached = await redis.get(key);

    if (cached) {
        return JSON.parse(cached);
    }
     const urls = await repo.getByUser(userId);
     await redis.setEx(
        key, 
        300, 
        JSON.stringify(urls),
     );

    return urls;

};

export const getUrlStats = async ({ code, userId }) => {
    const stats = await repo.getStats(code, userId);

    if (!stats) {
        throw { status: 404, message: "Not found" };
    }

    const clicksOverTime = await repo.getClicksOverTime(code);

    return {
        ...stats,
        clicksOverTime,
    };
};

export const removeUrl = async ({ code, userId }) => {
    const info = await repo.deleteByCode(code, userId);

    if (info.changes === 0) {
        throw { status: 404, message: "Not found or not yours" };
    }

    await redis.del(`url:${code}`);
    await redis.del(`user:${userId}:urls`);
    return { message: "Deleted" };
};

export const resolveShortUrl = async ({ code }) => {

    if (code === "favicon.ico") {
        throw { status: 404 };
    }
    // redis first 
    const cachedKey = `url:${code}`;

    const cached = await redis.get(cachedKey);

    if(cached){
        console.log("Cache Hit");
        await repo.incrementClick(code);
        return JSON.parse(cached);
    }
    console.log("Cache Miss");
    // query DB
    const row = await repo.findByCode(code);

    if (!row) {
        return null;
    }   

    await redis.setEx(
        cachedKey,
        3600,
        JSON.stringify(row),
        
    );

    await repo.incrementClick(code);
    await redis.del(`user:${row.userId}:urls`);

    return row;
};

export const logClick = async ({ code, referrer, userAgent }) => {
    await repo.logClick(code, referrer, userAgent);
};