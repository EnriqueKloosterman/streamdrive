process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test_secret_at_least_32_chars_long_for_session';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DB_PATH = './db/test-streamdrive.sqlite';

const sinon = require('sinon');
const request = require('supertest');
const { getSequelize } = require('../src/config/db');
const { User } = require('../src/models/User');
const { Course } = require('../src/models/Course');
const { Lesson } = require('../src/models/Lesson');
const { Progress } = require('../src/models/Progress');
const authModule = require('../src/middleware/auth');

let app;
let authStub;
const testUser = {
  id: 'test-user-id',
  google_id: '12345',
  name: 'Test User',
  email: 'test@example.com',
  picture: null,
};

async function setupApp() {
  if (authStub) {
    authStub.restore();
  }
  authStub = sinon.stub(authModule, 'requireAuth').callsFake((req, res, next) => {
    req.user = { ...testUser };
    req.isAuthenticated = () => true;
    next();
  });
  if (!app) {
    const mod = require('../src/app');
    app = mod.app;
    await mod.startServer();
    await User.upsert({ ...testUser });
  }
}

async function cleanupDb() {
  const db = getSequelize();
  await db.query('PRAGMA foreign_keys = OFF');
  await Progress.destroy({ where: {} });
  await Lesson.destroy({ where: {} });
  await Course.destroy({ where: {} });
  await User.destroy({ where: {} });
  await db.query('PRAGMA foreign_keys = ON');
  await User.upsert({ ...testUser });
}

async function createTestCourse(overrides = {}) {
  return Course.create({
    id: 'test-course-id',
    drive_folder_id: 'folder-1',
    title: 'Test Course',
    description: 'A test course',
    tags: ['javascript', 'testing'],
    image_url: null,
    ...overrides,
  });
}

async function createTestLesson(overrides = {}) {
  return Lesson.create({
    id: 'test-lesson-id',
    course_id: 'test-course-id',
    drive_file_id: 'file-1',
    title: 'Test Lesson',
    description: 'A test lesson',
    summary: null,
    order: 0,
    duration: 120,
    section: null,
    chapters: null,
    subtitles: null,
    qualities: null,
    ...overrides,
  });
}

function get(url) {
  return request(app).get(url);
}

function put(url) {
  return request(app).put(url);
}

function post(url) {
  return request(app).post(url);
}

const { cache } = require('../src/middleware/cache');

function flushCache() {
  cache.keys().forEach(k => cache.del(k));
}

async function teardownApp() {
  if (authStub) authStub.restore();
}

module.exports = {
  setupApp,
  teardownApp,
  cleanupDb,
  flushCache,
  createTestCourse,
  createTestLesson,
  get,
  put,
  post,
  app,
  testUser,
};