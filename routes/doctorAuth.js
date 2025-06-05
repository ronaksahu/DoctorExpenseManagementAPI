const express = require('express')
const doctorController = require('../controller/doctorController')
const { clinicAddValidate } = require('../utility/validator')
const routes = express.Router()

// Middleware to check access_status
async function checkAccessGranted(req, res, next) {
    try {
        // Assuming req.user.id is set after authentication
        const doctor = await Doctor.findByPk(req.user.id);
        if (!doctor || doctor.access_status !== 'Granted') {
            return res.status(403).json({ message: 'Access not granted. Awaiting for Admin Approval.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}

routes.use(checkAccessGranted);


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
