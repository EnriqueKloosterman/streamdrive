const { expect } = require('chai');
const {
  setupApp,
  cleanupDb,
  flushCache,
  createTestCourse,
  createTestLesson,
} = require('../setup');
const { Lesson } = require('../../src/models');
const { __private: drivePrivate } = require('../../src/services/driveService');
const { __private: syncPrivate } = require('../../src/controllers/syncController');

describe('Drive sync service', () => {
  before(async () => {
    await setupApp();
  });

  beforeEach(async () => {
    await cleanupDb();
    flushCache();
  });

  it('removes lessons that no longer exist in the Drive folder', async () => {
    await createTestCourse({
      drive_folder_id: 'folder-sync',
      title: 'Existing Course',
      tags: [],
    });
    await createTestLesson({
      id: 'obsolete-lesson',
      drive_file_id: 'old-file',
      title: 'Obsolete Lesson',
    });

    const drive = {
      files: {
        list: async ({ q }) => {
          if (q.includes("name = 'course.md'")) return { data: { files: [] } };
          return {
            data: {
              files: [
                { id: 'new-file', name: '01-new.mp4', mimeType: 'video/mp4', size: '1000' },
              ],
            },
          };
        },
      },
    };

    await drivePrivate.syncCourse(drive, { id: 'folder-sync', name: 'Existing Course' });

    const lessons = await Lesson.findAll({ order: [['title', 'ASC']] });
    expect(lessons.map(l => l.drive_file_id)).to.deep.equal(['new-file']);
  });

  it('prevents a second sync lock from being acquired', async () => {
    await syncPrivate.releaseSyncLock();

    const first = await syncPrivate.acquireSyncLock();
    const second = await syncPrivate.acquireSyncLock();

    expect(first).to.equal(true);
    expect(second).to.equal(false);

    await syncPrivate.releaseSyncLock();
  });
});
