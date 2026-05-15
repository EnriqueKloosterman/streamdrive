const { expect } = require('chai');
const {
  setupApp,
  cleanupDb,
  flushCache,
  createTestCourse,
  createTestLesson,
  get,
  post,
  testUser,
} = require('../setup');

describe('Progress API', () => {
  before(async () => {
    await setupApp();
  });

  beforeEach(async () => {
    await cleanupDb();
    flushCache();
    await createTestCourse();
    await createTestLesson();
  });

  describe('POST /api/progress', () => {
    it('saves playback position', async () => {
      const res = await post('/api/progress')
        .send({ lessonId: 'test-lesson-id', currentTime: 42 });
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ lessonId: 'test-lesson-id', currentTime: 42, completed: false });
    });

    it('marks lesson as completed', async () => {
      const res = await post('/api/progress')
        .send({ lessonId: 'test-lesson-id', completed: true });
      expect(res.status).to.equal(200);
      expect(res.body.completed).to.be.true;
    });

    it('upserts progress (update existing)', async () => {
      await post('/api/progress').send({ lessonId: 'test-lesson-id', currentTime: 10 });
      const res = await post('/api/progress').send({ lessonId: 'test-lesson-id', currentTime: 99 });
      expect(res.body.currentTime).to.equal(99);
    });

    it('returns 404 for unknown lesson', async () => {
      const res = await post('/api/progress')
        .send({ lessonId: 'non-existent-lesson' });
      expect(res.status).to.equal(404);
    });

    it('validates required lessonId', async () => {
      const res = await post('/api/progress').send({ currentTime: 10 });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/progress/:courseId', () => {
    it('returns empty object when no progress exists', async () => {
      const res = await get('/api/progress/test-course-id');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({});
    });

    it('returns progress for each lesson', async () => {
      await post('/api/progress').send({ lessonId: 'test-lesson-id', currentTime: 30, completed: true });

      const res = await get('/api/progress/test-course-id');
      expect(res.body).to.have.property('test-lesson-id');
      expect(res.body['test-lesson-id']).to.include({ currentTime: 30, completed: true });
    });
  });

  describe('POST /api/progress/complete', () => {
    it('marks a lesson as completed', async () => {
      const res = await post('/api/progress/complete')
        .send({ lessonId: 'test-lesson-id' });
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ lessonId: 'test-lesson-id', completed: true });
    });

    it('returns 404 for unknown lesson', async () => {
      const res = await post('/api/progress/complete')
        .send({ lessonId: 'non-existent' });
      expect(res.status).to.equal(404);
    });

    it('validates required lessonId', async () => {
      const res = await post('/api/progress/complete').send({});
      expect(res.status).to.equal(400);
    });
  });
});
