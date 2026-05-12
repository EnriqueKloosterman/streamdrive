const { Course, Lesson } = require('../models');
const { invalidateCache } = require('../middleware/cache');

async function listCourses(req, res, next) {
  try {
    const where = {};
    if (req.query.tag) {
      where.tags = { [require('sequelize').Op.like]: `%"${req.query.tag}"%` };
    }

    const courses = await Course.findAll({
      where,
      attributes: {
        include: [
          [Course.sequelize.fn('COUNT', Course.sequelize.col('lessons.id')), 'lessonCount'],
        ],
      },
      include: [{
        model: Lesson,
        as: 'lessons',
        attributes: [],
      }],
      group: ['Course.id'],
    });

    const result = courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      tags: c.tags,
      image_url: c.image_url,
      lessonCount: parseInt(c.dataValues.lessonCount, 10) || 0,
      lastSync: c.last_sync,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getCourse(req, res, next) {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{
        model: Lesson,
        as: 'lessons',
        order: [['order', 'ASC']],
      }],
    });

    if (!course) {
      return res.status(404).json({
        error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' },
      });
    }

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      tags: course.tags,
      image_url: course.image_url,
      lastSync: course.last_sync,
      lessons: course.lessons.map(l => ({
        id: l.id,
        title: l.title,
        order: l.order,
        duration: l.duration,
        summary: l.summary,
        section: l.section,
        chapters: l.chapters ? JSON.parse(l.chapters) : [],
        subtitles: l.subtitles ? JSON.parse(l.subtitles) : [],
        drive_file_id: l.drive_file_id,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function updateCourse(req, res, next) {
  try {
    const { title, description, tags } = req.body;
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' },
      });
    }

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (tags !== undefined) course.tags = tags;

    await course.save();
    invalidateCache(`/api/courses/${course.id}`);

    res.json({
      id: course.id,
      title: course.title,
      description: course.description,
      tags: course.tags,
    });
  } catch (error) {
    next(error);
  }
}

async function saveCourseSummary(req, res, next) {
  try {
    const { summary } = req.body;
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({
        error: { code: 'COURSE_NOT_FOUND', message: 'Course not found.' },
      });
    }

    course.description = summary;
    await course.save();
    invalidateCache(`/api/courses/${course.id}`);

    res.json({ id: course.id, summary: course.description });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCourses, getCourse, updateCourse, saveCourseSummary };
