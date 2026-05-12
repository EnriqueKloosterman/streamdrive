const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  current_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'progress',
  indexes: [
    { unique: true, fields: ['user_id', 'lesson_id'] },
    { fields: ['user_id', 'course_id'] },
  ],
});

module.exports = { Progress };
