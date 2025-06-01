const express = require('express')
const doctorController = require('../controller/doctorController')
const { clinicAddValidate } = require('../utility/validator')
const routes = express.Router()

routes.post('/clinic', clinicAddValidate, doctorController.addClinic)
routes.get('/getClinicList', doctorController.getClinicList)
routes.put('/clinic/:id', doctorController.updateClinic)
routes.delete('/clinic/:id', doctorController.deleteClinic);

routes.post('/expense', doctorController.addExpense)
routes.get('/expense', doctorController.getAllExpenses);
routes.delete('/expense/:id', doctorController.deleteExpense);
routes.post('/expense/:id/payment', doctorController.addPayment);
routes.get('/getAllClinicNames', doctorController.getAllClinicNames);
routes.get('/getReport', doctorController.getReport);

module.exports = routes;    
