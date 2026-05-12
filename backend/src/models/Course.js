const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  drive_folder_id: {
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
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('tags');
      return raw ? JSON.parse(raw) : [];
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value));
    },
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'courses',
});

module.exports = { Course };
