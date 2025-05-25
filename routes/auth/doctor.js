const express = require('express')
const routes = express.Router()

const { doctorRegisterAuthValidate, doctorSignInAuthValidate } = require('../../utility/validator');
const doctorAuthController = require('../../controller/auth/doctorAuthController');


routes.post('/register', doctorRegisterAuthValidate, doctorAuthController.register)
routes.post('/signin', doctorSignInAuthValidate, doctorAuthController.signIn);


module.exports = routes;
