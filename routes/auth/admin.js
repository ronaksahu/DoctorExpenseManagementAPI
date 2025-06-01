const express = require('express')
const routes = express.Router()

const adminAuthController = require('../../controller/auth/adminAuthController');
const { adminAuthValidate } = require('../../utility/validator');


routes.post('/register', adminAuthValidate, adminAuthController.register)
routes.post('/signin', adminAuthValidate, adminAuthController.signIn);
routes.post('/logout', (req, res) => {
    // If using JWT, just instruct client to delete token
    res.status(200).json({ message: 'Admin logged out successfully.' });
});


module.exports = routes;
