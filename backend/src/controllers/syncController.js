const { syncFromDrive } = require('../services/driveService');
const { invalidateCache } = require('../middleware/cache');
const { Course, Lesson } = require('../models');

let syncState = {
  inProgress: false,
  lastSyncAt: null,
  lastSyncResult: null,
};

async function startSync(req, res, next) {
  if (syncState.inProgress) {
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

module.exports = { startSync, getSyncStatus };
