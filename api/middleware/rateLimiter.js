const rateLimit = require('express-rate-limit');

// Strict limiter for authentication routes (login/register)
// NOTE: For production, consider using a RedisStore to share rate limit state across multiple instances.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30, // Limit each IP to 30 requests per windowMs (adjusted from 10 to accommodate passkey flows)
    message: {
        error: 'Too many authentication attempts, please try again after 15 minutes'
    },
    standardHeaders: 'draft-7', // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// General limiter for other API endpoints
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 300, // Limit each IP to 300 requests per minute (adjusted from 100 for smoother SPA experience)
    message: {
        error: 'Too many requests, please slow down.'
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

module.exports = { authLimiter, apiLimiter };
