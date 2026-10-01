// Imported first by helpers.js: tests create many accounts from one IP, so relax the auth rate limit
// (the limiter itself is covered in ratelimit.test.js). Must run before server modules are loaded.
process.env.AUTH_RATE_LIMIT_MAX ??= '100000'
process.env.JWT_SECRET ??= 'test-secret-that-is-long-enough'
process.env.NODE_ENV = 'test'
