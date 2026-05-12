const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || './db/streamdrive.sqlite',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

async function connectDB() {
  try {
    await sequelize.authenticate();

    await sequelize.query('PRAGMA foreign_keys = OFF');
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Models synchronized');
    }
    await sequelize.query('PRAGMA foreign_keys = ON');
    console.log('SQLite connected via Sequelize');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
