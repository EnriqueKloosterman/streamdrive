const { expect } = require('chai');
const {
  setupApp,
  cleanupDb,
  flushCache,
  createTestCourse,
  createTestLesson,
  get,
  put,
} = require('../setup');

describe('Courses API', () => {
  before(async () => {
    await setupApp();
  });

  beforeEach(async () => {
    await cleanupDb();
    flushCache();
  });

  describe('GET /api/courses', () => {
    it('returns empty array when no courses exist', async () => {
      const res = await get('/api/courses');
      expect(res.status).to.equal(200);
      expect(res.body.courses).to.be.an('array').that.is.empty;
      expect(res.body).to.include({ total: 0, page: 1, limit: 12, totalPages: 0 });
    });

    it('returns all courses with correct fields', async () => {
      await createTestCourse({ title: 'Course A', tags: [] });
      await createTestCourse({
        id: 'test-course-id-2',
        drive_folder_id: 'folder-2',
        title: 'Course B',
        tags: [],
      });

      const res = await get('/api/courses');
      expect(res.status).to.equal(200);
      expect(res.body.courses).to.have.lengthOf(2);
      expect(res.body).to.include({ total: 2, page: 1, limit: 12, totalPages: 1 });

      const titles = res.body.courses.map(c => c.title).sort();
      expect(titles).to.deep.equal(['Course A', 'Course B']);
    });

    it('filters courses by tag', async () => {
      await createTestCourse({ title: 'JS Course', tags: ['javascript'] });
      await createTestCourse({
        id: 'test-course-id-2',
        drive_folder_id: 'folder-2',
        title: 'Python Course',
        tags: ['python'],
      });

      const res = await get('/api/courses?tag=javascript');
      expect(res.status).to.equal(200);
      expect(res.body.courses).to.have.lengthOf(1);
      expect(res.body.courses[0].title).to.equal('JS Course');
    });

    it('returns empty array for non-matching tag', async () => {
      await createTestCourse({ title: 'Course', tags: ['javascript'] });
      const res = await get('/api/courses?tag=rust');
      expect(res.status).to.equal(200);
      expect(res.body.courses).to.be.an('array').that.is.empty;
    });

    it('respects page and limit params', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestCourse({
          id: `course-${i}`,
          drive_folder_id: `folder-${i}`,
          title: `Course ${i}`,
          tags: [],
        });
      }

      const page1 = await get('/api/courses?page=1&limit=2');
      expect(page1.body.courses).to.have.lengthOf(2);
      expect(page1.body).to.include({ total: 5, page: 1, limit: 2, totalPages: 3 });

      const page3 = await get('/api/courses?page=3&limit=2');
      expect(page3.body.courses).to.have.lengthOf(1);
      expect(page3.body).to.include({ total: 5, page: 3, limit: 2, totalPages: 3 });
    });

    it('clamps page to minimum 1', async () => {
      const res = await get('/api/courses?page=0&limit=2');
      expect(res.body).to.include({ page: 1 });
    });

    it('clamps limit between 1 and 100', async () => {
      const res1 = await get('/api/courses?limit=0');
      expect(res1.status).to.equal(200);
      expect(res1.body.limit).to.be.within(1, 100);

      const res2 = await get('/api/courses?limit=999');
      expect(res2.status).to.equal(200);
      expect(res2.body.limit).to.equal(100);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('returns course with nested lessons', async () => {
      await createTestCourse();
      await createTestLesson({ title: 'Lesson 1', order: 1 });
      await createTestLesson({
        id: 'test-lesson-id-2',
        drive_file_id: 'file-2',
        title: 'Lesson 2',
        order: 2,
      });

      const res = await get('/api/courses/test-course-id');
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ title: 'Test Course' });
      expect(res.body.lessons).to.have.lengthOf(2);
      expect(res.body.lessons[0].title).to.equal('Lesson 1');
    });

    it('returns 404 for unknown course', async () => {
      const res = await get('/api/courses/non-existent-id');
      expect(res.status).to.equal(404);
      expect(res.body.error).to.exist;
    });

    it('does not cache 404 responses', async () => {
      const missing = await get('/api/courses/course-created-later');
      expect(missing.status).to.equal(404);

      await createTestCourse({
        id: 'course-created-later',
        drive_folder_id: 'folder-created-later',
        title: 'Created Later',
        tags: [],
      });

      const found = await get('/api/courses/course-created-later');
      expect(found.status).to.equal(200);
      expect(found.body.title).to.equal('Created Later');
    });

    it('includes lesson summary and subtitle info', async () => {
      await createTestCourse();
      await createTestLesson({
        summary: 'This is a summary',
        subtitles: JSON.stringify([{ language: 'en', label: 'English' }]),
      });

      const res = await get('/api/courses/test-course-id');
      expect(res.body.lessons[0]).to.include({ summary: 'This is a summary' });
      expect(res.body.lessons[0].subtitles).to.deep.equal([{ language: 'en', label: 'English' }]);
    });
  });

  describe('PUT /api/courses/:id', () => {
    it('updates course title and description', async () => {
      await createTestCourse();
      const res = await put('/api/courses/test-course-id')
        .send({ title: 'Updated Title', description: 'Updated description' });
      expect(res.status).to.equal(200);
      expect(res.body).to.include({ title: 'Updated Title', description: 'Updated description' });
    });

    it('updates course tags', async () => {
      await createTestCourse();
      const res = await put('/api/courses/test-course-id')
        .send({ tags: ['new-tag', 'another-tag'] });
      expect(res.status).to.equal(200);
      expect(res.body.tags).to.deep.equal(['new-tag', 'another-tag']);
    });

    it('returns 404 for unknown course', async () => {
      const res = await put('/api/courses/non-existent')
        .send({ title: 'Nope' });
      expect(res.status).to.equal(404);
    });

    it('validates request body', async () => {
      await createTestCourse();
      const res = await put('/api/courses/test-course-id')
        .send({ tags: 'not-an-array' });
      expect(res.status).to.equal(400);
    });
  });
});
