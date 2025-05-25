const { DataTypes } = require('sequelize');
const { sequelize } = require('../utility/db');
const Expense = require('./expense');

const Payment = sequelize.define('Payment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    expense_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Expense,
            key: 'id'
        },
        allowNull: false,
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'payment',
    timestamps: false
});

Payment.belongsTo(Expense, { foreignKey: 'expense_id', as: 'expense' });

module.exports = Payment;