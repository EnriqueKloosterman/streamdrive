const { syncFromDrive } = require('../services/driveService');
const { invalidateCache } = require('../middleware/cache');
const { Course, Lesson } = require('../models');
const { sequelize } = require('../config/db');

let syncState = {
  inProgress: false,
  lastSyncAt: null,
  lastSyncResult: null,
};

const SYNC_LOCK_NAME = 'drive-sync';
const SYNC_LOCK_TTL_MS = 15 * 60 * 1000;

async function ensureSyncLockTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS sync_locks (
      name TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    )
  `);
}

async function acquireSyncLock() {
  await ensureSyncLockTable();
  const now = Date.now();
  await sequelize.query('DELETE FROM sync_locks WHERE expires_at <= ?', {
    replacements: [now],
  });

  try {
    await sequelize.query('INSERT INTO sync_locks (name, expires_at) VALUES (?, ?)', {
      replacements: [SYNC_LOCK_NAME, now + SYNC_LOCK_TTL_MS],
    });
    return true;
  } catch (error) {
    if (error.parent?.code === 'SQLITE_CONSTRAINT' || error.name === 'SequelizeUniqueConstraintError') {
      return false;
    }
    throw error;
  }
}

async function releaseSyncLock() {
  await ensureSyncLockTable();
  await sequelize.query('DELETE FROM sync_locks WHERE name = ?', {
    replacements: [SYNC_LOCK_NAME],
  });
}

async function startSync(req, res, next) {
  if (syncState.inProgress) {
    return res.status(409).json({
      error: { code: 'SYNC_IN_PROGRESS', message: 'Sync already in progress.' },
    });
  }

  let lockAcquired = false;
  try {
    lockAcquired = await acquireSyncLock();
  } catch (error) {
    return next(error);
  }

  if (!lockAcquired) {
    return res.status(409).json({
      error: { code: 'SYNC_IN_PROGRESS', message: 'Sync already in progress.' },
    });
  }

  syncState.inProgress = true;
  syncState.lastSyncResult = null;

  const syncId = Date.now().toString();

  syncFromDrive()
    .then(async (result) => {
      const totalCourses = await Course.count();
      const totalLessons = await Lesson.count();
      syncState.inProgress = false;
      syncState.lastSyncAt = new Date();
      syncState.lastSyncResult = { ...result, totalCourses, totalLessons };
      invalidateCache('/api/courses');
      (result.updatedCourseIds || []).forEach(id => invalidateCache(`/api/courses/${id}`));
    })
    .catch((error) => {
      syncState.inProgress = false;
      syncState.lastSyncAt = new Date();
      syncState.lastSyncResult = { error: error.message };
      console.error('[Sync Error]', error);
    })
    .finally(async () => {
      try {
        await releaseSyncLock();
      } catch (releaseError) {
        console.error('[Sync Lock Release Error]', releaseError.message);
      }
    });

  res.json({ message: 'Sync started', syncId });
}

function getSyncStatus(req, res) {
  res.json({
    inProgress: syncState.inProgress,
    lastSyncAt: syncState.lastSyncAt,
    lastSyncResult: syncState.lastSyncResult,
  });
}

module.exports = {
  startSync,
  getSyncStatus,
  __private: {
    acquireSyncLock,
    releaseSyncLock,
    ensureSyncLockTable,
  },
};
