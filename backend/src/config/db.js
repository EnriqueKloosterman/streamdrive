const { Sequelize } = require('sequelize');

let _sequelize = null;

function getSequelize() {
  if (!_sequelize) {
    const storage = process.env.NODE_ENV === 'test'
      ? ':memory:'
      : (process.env.DB_PATH || './db/streamdrive.sqlite');
    _sequelize = new Sequelize({
      dialect: 'sqlite',
      storage,
      logging: process.env.DB_LOG === 'true' ? console.log : false,
      define: { timestamps: true, underscored: true },
    });
  }
  return _sequelize;
}

Object.defineProperty(module.exports, 'sequelize', {
  get: () => getSequelize(),
});

async function connectDB() {
  const db = getSequelize();
  try {
    await db.authenticate();

    await db.query('PRAGMA foreign_keys = OFF');
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await db.sync({ force: process.env.NODE_ENV === 'test' });
      console.log('Models synchronized');
    }
    await db.query('PRAGMA foreign_keys = ON');
    console.log('SQLite connected via Sequelize');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    if (error.name) console.error('Database error type:', error.name);
    if (error.parent?.message) console.error('Database driver error:', error.parent.message);
    if (error.errors?.length) {
      console.error('Database validation errors:', error.errors.map(e => ({
        message: e.message,
        path: e.path,
        type: e.type,
      })));
    }
    if (process.env.NODE_ENV !== 'test') process.exit(1);
    throw error;
  }
}

module.exports.connectDB = connectDB;
module.exports.getSequelize = getSequelize;
