const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    if (cached) {
      return res.json(cached);
    }
    res.sendResponse = res.json;
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, duration);
      }
      res.sendResponse(body);
    };
    next();
  };
}

function invalidateCache(pattern) {
  const keys = cache.keys().filter(k => k.startsWith(pattern));
  keys.forEach(k => cache.del(k));
}

module.exports = { cacheMiddleware, invalidateCache, cache };
