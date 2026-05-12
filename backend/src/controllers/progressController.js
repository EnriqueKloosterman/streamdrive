const { Progress, Lesson } = require('../models');

async function saveProgress(req, res, next) {
  try {
    const { lessonId, currentTime, completed } = req.body;
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }

    const data = {
      user_id: req.user.id,
      lesson_id: lessonId,
      course_id: lesson.course_id,
      current_time: currentTime ?? 0,
    };
    if (completed !== undefined) data.completed = completed;

    const [progress] = await Progress.upsert(data);

    res.json({
      lessonId: progress.lesson_id,
      currentTime: progress.current_time,
      completed: progress.completed,
    });
  } catch (error) {
    next(error);
  }
}

async function getProgress(req, res, next) {
  try {
    const courseId = req.params.courseId;
    const rows = await Progress.findAll({
      where: { user_id: req.user.id, course_id: courseId },
      attributes: ['lesson_id', 'current_time', 'completed'],
    });

    const map = {};
    for (const r of rows) {
      map[r.lesson_id] = { currentTime: r.current_time, completed: r.completed };
    }

    res.json(map);
  } catch (error) {
    next(error);
  }
}

async function markCompleted(req, res, next) {
  try {
    const { lessonId } = req.body;
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found.' },
      });
    }

    await Progress.upsert({
      user_id: req.user.id,
      lesson_id: lessonId,
      course_id: lesson.course_id,
      current_time: 0,
      completed: true,
    });

    res.json({ lessonId, completed: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { saveProgress, getProgress, markCompleted };
