const express = require('express')
const adminController = require('../controller/adminController')
const { accessStatusValidate } = require('../utility/validator')

const routes = express.Router()

routes.get('/getDoctorList', adminController.getAllDoctors)
routes.put('/updateDoctorAccessStatus/:id/accessStatus', accessStatusValidate, adminController.updateDoctorAccessStatus)


module.exports = routes;
