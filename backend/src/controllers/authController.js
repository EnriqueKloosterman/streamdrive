const passport = require('passport');

function googleAuth(req, res, next) {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: true,
  })(req, res, next);
}

function googleCallback(req, res, next) {
  passport.authenticate('google', {
    successRedirect: `${process.env.FRONTEND_URL}/dashboard`,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  })(req, res, next);
}

function getMe(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
    });
  }

  res.json({
    id: req.user.id,
    googleId: req.user.google_id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
  });
}

function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  });
}

module.exports = { googleAuth, googleCallback, getMe, logout };
