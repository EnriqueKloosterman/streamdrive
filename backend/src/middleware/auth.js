function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
    });
  }
  next();
}

function optionalAuth(req, res, next) {
  next();
}

module.exports = { requireAuth, optionalAuth };
