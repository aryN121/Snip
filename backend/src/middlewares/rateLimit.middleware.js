import redis from "../config/redis.js";


export const rateLimiter = ({ limit, window, keyGenerator }) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator(req);

            const requests = await redis.incr(key);

            if (requests === 1) {
                await redis.expire(key, window);
            }

            if (requests > limit) {
                const ttl = await redis.ttl(key);

                return res.status(429).json({
                    message: "Too many requests",
                    retryAfter: ttl,
                });
            }

            next();
        } catch (err) {
            console.error(err);
            next(err);
        }
    };
};