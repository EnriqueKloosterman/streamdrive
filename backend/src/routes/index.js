const { connectDB } = require('../config/db');

async function initDatabase() {
  await connectDB();
}

module.exports = { initDatabase };
