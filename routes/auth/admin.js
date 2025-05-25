const express = require('express')
const routes = express.Router()

const adminAuthController = require('../../controller/auth/adminAuthController');
const { adminAuthValidate } = require('../../utility/validator');


routes.post('/register', adminAuthValidate, adminAuthController.register)
routes.post('/signin', adminAuthValidate, adminAuthController.signIn);


module.exports = routes;
