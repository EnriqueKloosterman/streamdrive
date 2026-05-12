const { User } = require('./User');
const { Course } = require('./Course');
const { Lesson } = require('./Lesson');
const { Progress } = require('./Progress');

Course.hasMany(Lesson, { foreignKey: 'course_id', as: 'lessons', onDelete: 'CASCADE' });
Lesson.belongsTo(Course, { foreignKey: 'course_id', onDelete: 'CASCADE' });

Progress.belongsTo(User, { foreignKey: 'user_id' });
Progress.belongsTo(Lesson, { foreignKey: 'lesson_id' });

module.exports = { User, Course, Lesson, Progress };
