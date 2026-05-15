const { expect } = require('chai');
const {
  setupApp,
  cleanupDb,
  flushCache,
  createTestCourse,
  createTestLesson,
  get,
  put,
  post,
} = require('../setup');

describe('Lessons API', () => {
  before(async () => {
    await setupApp();
  });

  beforeEach(async () => {
    await cleanupDb();
    flushCache();
    await createTestCourse();
    await createTestLesson();
  });

  describe('GET /api/lessons/:id', () => {
    it('returns lesson details', async () => {
      const res = await get('/api/lessons/test-lesson-id');
      expect(res.status).to.equal(200);
      expect(res.body).to.include({
        id: 'test-lesson-id',
        title: 'Test Lesson',
        description: 'A test lesson',
      });
    });

    it('returns 404 for unknown lesson', async () => {
      const res = await get('/api/lessons/non-existent');
      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('updates lesson title and summary', async () => {
      const res = await put('/api/lessons/test-lesson-id')
        .send({ title: 'Updated', summary: 'New summary' });
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ title: 'Updated', summary: 'New summary' });
    });

    it('updates lesson chapters', async () => {
      const chapters = [{ time: 0, title: 'Intro' }, { time: 30, title: 'Middle' }];
      const res = await put('/api/lessons/test-lesson-id')
        .send({ chapters });
      expect(res.status).to.equal(200);
      expect(res.body.chapters).to.deep.equal(chapters);
    });

    it('returns 404 for unknown lesson', async () => {
      const res = await put('/api/lessons/non-existent')
        .send({ title: 'Nope' });
      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/lessons/:id/thumbnail', () => {
    it('saves a valid thumbnail', async () => {
      const fakeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = await post('/api/lessons/test-lesson-id/thumbnail')
        .send({ dataUrl: fakeDataUrl });
      expect(res.status).to.equal(200);
      expect(res.body.thumbnail_url).to.match(/^\/thumbnails\/test-lesson-id\.png$/);
    });

    it('returns 400 for invalid data URL', async () => {
      const res = await post('/api/lessons/test-lesson-id/thumbnail')
        .send({ dataUrl: 'not-a-data-url' });
      expect(res.status).to.equal(400);
    });

    it('returns 400 for missing dataUrl', async () => {
      const res = await post('/api/lessons/test-lesson-id/thumbnail')
        .send({});
      expect(res.status).to.equal(400);
    });

    it('returns 404 for unknown lesson', async () => {
      const res = await post('/api/lessons/non-existent/thumbnail')
        .send({ dataUrl: 'data:image/png;base64,abc' });
      expect(res.status).to.equal(404);
    });
  });
});
