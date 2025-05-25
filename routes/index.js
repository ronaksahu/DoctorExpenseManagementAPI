const express = require('express')
const adminAuth = require('./auth/admin');
const doctorAuth = require('./auth/doctor');
const adminRoutes = require('./adminAuth');
const doctorRoutes = require('./doctorAuth');
var utils = require('../utility/utils')


var router = express.Router()


router.get('/status', (req, res) => {
    res.status(200).send('ok')
})

router.use('/auth/admin', adminAuth);
router.use('/auth/doctor', doctorAuth);

router.use('/admin', utils.authenticateToken, utils.isAdmin, adminRoutes);
router.use('/doctor', utils.authenticateToken, utils.isDoctor, doctorRoutes)

module.exports = router;