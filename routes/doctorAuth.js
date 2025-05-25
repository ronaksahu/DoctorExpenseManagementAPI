const express = require('express')
const doctorController = require('../controller/doctorController')
const { clinicAddValidate } = require('../utility/validator')
const routes = express.Router()

routes.post('/clinic', clinicAddValidate, doctorController.addClinic)
routes.get('/getClinicList', doctorController.getClinicList)
routes.put('/clinic/:id', doctorController.updateClinic)
routes.delete('/clinic/:id', doctorController.deleteClinic);

routes.post('/expense', doctorController.addExpense)


module.exports = routes;    
