const { DataTypes } = require('sequelize');
const { sequelize } = require('../utility/db');
const Clinic = require('./clinic');

const Expense = sequelize.define('Expense', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    pending_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    expense_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    billed_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    tds_deducted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tds_status: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    tds_amount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0
    },
    payment_mode: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    payment_status: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    clinic_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Clinic,
            key: 'id'
        },
        allowNull: false,
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'expense',
    timestamps: false
});

Expense.belongsTo(Clinic, { foreignKey: 'clinic_id', as: 'clinic' });

module.exports = Expense;