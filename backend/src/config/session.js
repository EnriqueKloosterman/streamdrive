const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

function configureSession() {
  const dbDir = path.dirname(process.env.DB_PATH || './db/streamdrive.sqlite');
  return session({
    store: new SQLiteStore({ dir: dbDir, db: 'sessions.db' }),
    secret: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}

module.exports = { configureSession };
