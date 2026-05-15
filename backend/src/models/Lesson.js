const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Lesson = sequelize.define('Lesson', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  drive_file_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  chapters: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  section: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subtitles: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  thumbnail_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  qualities: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'lessons',
});

module.exports = { Lesson };
