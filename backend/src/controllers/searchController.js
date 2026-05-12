const { Op } = require('sequelize');
const { Course, Lesson } = require('../models');

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.json({ courses: [], lessons: [] });
    }

    const like = `%${q}%`;

    const [courses, lessons] = await Promise.all([
      Course.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: like } },
            { description: { [Op.like]: like } },
          ],
        },
        attributes: ['id', 'title', 'description', 'tags', 'last_sync'],
      }),
      Lesson.findAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: like } },
            { summary: { [Op.like]: like } },
          ],
        },
        attributes: ['id', 'course_id', 'title', 'summary', 'order'],
      }),
    ]);

    res.json({ courses, lessons });
  } catch (error) {
    next(error);
  }
}

module.exports = { search };
