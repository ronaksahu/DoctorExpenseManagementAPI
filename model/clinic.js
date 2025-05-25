const { DataTypes } = require('sequelize');
const { sequelize } = require('../utility/db');
const Doctor = require('./doctor');

const Clinic = sequelize.define('Clinic', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    admin_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    additional_info: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contact_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Doctor,
            key: 'id'
        },
        allowNull: true,
        onDelete: 'SET NULL'
    }
}, {
    tableName: 'clinic',
    timestamps: true
});

// Association (optional, if you want to use Sequelize relations)
Clinic.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

module.exports = Clinic;