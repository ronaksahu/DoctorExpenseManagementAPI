const { DataTypes } = require('sequelize');
const { sequelize } = require('../utility/db');
const bcrypt = require('bcrypt');

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    degree: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contact_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    specialty: {
        type: DataTypes.STRING,
        allowNull: true
    },
    access_status: {
        type: DataTypes.ENUM('Requested', 'Granted', 'Revoked'),
        allowNull: false,
        defaultValue: 'Requested'
    }
}, {
    tableName: 'doctor',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
        if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
        if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
  }
});

module.exports = Doctor;