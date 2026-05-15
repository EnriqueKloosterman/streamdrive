const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../config/limiter');
const { cacheMiddleware } = require('../middleware/cache');
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController');
const searchController = require('../controllers/searchController');
const syncController = require('../controllers/syncController');
const progressController = require('../controllers/progressController');

const router = Router();

router.use(requireAuth, authLimiter);

router.get('/courses', cacheMiddleware(300), courseController.listCourses);
router.get('/courses/:id', cacheMiddleware(300), courseController.getCourse);
router.put('/courses/:id', [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('tags').optional().isArray(),
  validate,
], courseController.updateCourse);
router.post('/courses/:id/summary', [
  body('summary').isString().trim(),
  validate,
], courseController.saveCourseSummary);

router.get('/lessons/:id', lessonController.getLesson);
router.put('/lessons/:id', [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('summary').optional().isString().trim(),
  body('chapters').optional().isArray(),
  validate,
], lessonController.updateLesson);
router.get('/lessons/:id/stream', lessonController.streamVideo);
router.get('/lessons/:id/subtitles/:index', lessonController.getSubtitle);
router.post('/lessons/:id/thumbnail', [
  body('dataUrl').isString(),
  validate,
], lessonController.saveThumbnail);

router.get('/search', searchController.search);

router.post('/sync', syncController.startSync);
router.get('/sync/status', syncController.getSyncStatus);

router.post('/progress', [
  body('lessonId').isString(),
  body('currentTime').optional().isInt({ min: 0 }),
  body('completed').optional().isBoolean(),
  validate,
], progressController.saveProgress);
router.get('/progress/:courseId', progressController.getProgress);
router.post('/progress/complete', [
  body('lessonId').isString(),
  validate,
], progressController.markCompleted);

module.exports = router;
