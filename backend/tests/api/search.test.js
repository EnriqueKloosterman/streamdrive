const { expect } = require('chai');
const {
  setupApp,
  cleanupDb,
  flushCache,
  createTestCourse,
  createTestLesson,
  get,
} = require('../setup');

describe('GET /api/search', () => {
  before(async () => {
    await setupApp();
  });

  beforeEach(async () => {
    await cleanupDb();
    flushCache();
  });

  it('returns empty results when no query given', async () => {
    await createTestCourse({ title: 'JavaScript Basics' });
    const res = await get('/api/search');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ courses: [], lessons: [] });
  });

  it('searches courses by title', async () => {
    await createTestCourse({ title: 'JavaScript Basics', tags: [] });
    await createTestCourse({
      id: 'tc-2',
      drive_folder_id: 'f2',
      title: 'Python 101',
      tags: [],
    });

    const res = await get('/api/search?q=javascript');
    expect(res.status).to.equal(200);
    expect(res.body.courses).to.have.lengthOf(1);
    expect(res.body.courses[0].title).to.equal('JavaScript Basics');
  });

  it('searches courses by description', async () => {
    await createTestCourse({ title: 'Course A', description: 'Learn react and redux', tags: [] });
    await createTestCourse({
      id: 'tc-2',
      drive_folder_id: 'f2',
      title: 'Course B',
      description: 'Learn vue',
      tags: [],
    });

    const res = await get('/api/search?q=react');
    expect(res.status).to.equal(200);
    expect(res.body.courses).to.have.lengthOf(1);
    expect(res.body.courses[0].title).to.equal('Course A');
  });

  it('searches lessons by title', async () => {
    await createTestCourse({ tags: [] });
    await createTestLesson({ title: 'React Components', order: 1 });
    await createTestLesson({
      id: 'tl-2',
      drive_file_id: 'f2',
      title: 'Vue Components',
      order: 2,
    });

    const res = await get('/api/search?q=react');
    expect(res.status).to.equal(200);
    expect(res.body.lessons).to.have.lengthOf(1);
    expect(res.body.lessons[0].title).to.equal('React Components');
  });

  it('searches lessons by summary', async () => {
    await createTestCourse({ tags: [] });
    await createTestLesson({ title: 'Lesson 1', summary: 'Covers react hooks', order: 1 });
    await createTestLesson({
      id: 'tl-2',
      drive_file_id: 'f2',
      title: 'Lesson 2',
      summary: 'Covers vue basics',
      order: 2,
    });

    const res = await get('/api/search?q=hooks');
    expect(res.status).to.equal(200);
    expect(res.body.lessons).to.have.lengthOf(1);
    expect(res.body.lessons[0].title).to.equal('Lesson 1');
  });

  it('is case insensitive', async () => {
    await createTestCourse({ title: 'JavaScript', tags: [] });
    const res = await get('/api/search?q=JAVASCRIPT');
    expect(res.status).to.equal(200);
    expect(res.body.courses).to.have.lengthOf(1);
  });

  it('returns both courses and lessons in one response', async () => {
    await createTestCourse({ title: 'React Course', tags: [] });
    await createTestLesson({ title: 'React Components', summary: 'react stuff', order: 1 });

    const res = await get('/api/search?q=react');
    expect(res.body.courses).to.have.lengthOf(1);
    expect(res.body.lessons).to.have.lengthOf(1);
  });
});
