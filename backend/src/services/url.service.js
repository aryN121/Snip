import { nanoid } from "nanoid";
import * as repo from "../repositories/url.repository.js";
import { isValidUrl, isValidSlug } from "../utils/validators.js";

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

    return {
        shortCode,
        shortUrl: `${host}/${shortCode}`,
        original: url,
        clicks: 0,
        createdAt: new Date().toISOString(),
    };
};

export const getUserUrls = async ({ userId, search }) => {
    return search
        ? await repo.searchByUser(userId, search)
        : await repo.getByUser(userId);
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

    return { message: "Deleted" };
};

export const resolveShortUrl = async ({ code }) => {
    if (code === "favicon.ico") {
        throw { status: 404 };
    }

    const row = await repo.findByCode(code);

    if (!row) {
        return null;
    }

    await repo.incrementClick(code);

    return row;
};

export const logClick = async ({ code, referrer, userAgent }) => {
    await repo.logClick(code, referrer, userAgent);
};