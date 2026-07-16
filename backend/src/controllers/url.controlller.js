import * as urlService from "../services/url.service.js";

export const shorten = async (req, res , next) => {
    try {
        const result = await urlService.createShortUrl({
            url: req.body.url,
            customSlug: req.body.customSlug,
            userId: req.user.sub,
            host: `${req.protocol}://${req.get("host")}`,
        });

        res.status(result.reused ? 200 : 201).json(result);
    } catch (err) {
        res.status(err.status || 500).json({
            error: err.message || "Internal Server Error",
        });
    }
};

export const getUrls = async (req, res , next) => {
    const rows = await urlService.getUserUrls({
        userId: req.user.sub,
        search: req.query.q,
    });

    res.json(rows);
};

export const getStats = async (req, res , next) => {
    try {
        const stats = await urlService.getUrlStats({
            code: req.params.code,
            userId: req.user.sub,
        });

        res.json(stats);
    } catch (err) {
        res.status(err.status || 500).json({
            error: err.message || "Internal Server Error",
        });
    }
};

export const deleteUrl = async (req, res ,next) => {
    try {
        const result = await urlService.removeUrl({
            code: req.params.code,
            userId: req.user.sub,
        });

        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({
            error: err.message || "Internal Server Error",
        });
    }
};

export const redirect = async (req, res , next) => {
    try {
        const row = await urlService.resolveShortUrl({
            code: req.params.code,
        });

        if (!row) {
            return res.redirect(
                `${process.env.FRONTEND_URL || "http://localhost:5173"}/not-found`
            );
        }

        await urlService.logClick({
            code: req.params.code,
            referrer: req.get("referrer") || null,
            userAgent: req.get("user-agent") || null,
        });

        return res.redirect(row.original);
    } catch (err) {
        return res.sendStatus(err.status || 500);
    }
};