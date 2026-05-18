require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
require('./config/passport');
const { configureSession } = require('./config/session');
const { publicLimiter } = require('./config/limiter');
const { errorHandler } = require('./middleware/errorHandler');
const { initDatabase } = require('./routes');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(publicLimiter);
app.use(configureSession());
app.use(passport.initialize());
app.use(passport.session());

app.use('/thumbnails', express.static(path.resolve(__dirname, '../thumbnails')));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

app.use(errorHandler);

async function startServer() {
  await initDatabase();
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`StreamDrive API running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, initDatabase };
