const express = require('express')
const routes = express.Router()

const { doctorRegisterAuthValidate, doctorSignInAuthValidate } = require('../../utility/validator');
const doctorAuthController = require('../../controller/auth/doctorAuthController');


routes.post('/register', doctorRegisterAuthValidate, doctorAuthController.register)
routes.post('/signin', doctorSignInAuthValidate, doctorAuthController.signIn);
routes.post('/logout', (req, res) => {
    // If using JWT, just instruct client to delete token
    res.status(200).json({ message: 'Doctor logged out successfully.' });
});


module.exports = routes;
