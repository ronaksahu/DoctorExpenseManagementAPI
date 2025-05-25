const Admin = require("../../model/admin");
const bcrypt = require('bcrypt');
const utils = require("../../utility/utils");

var adminAuthController = {
    register: async function(req, res) {
        try {
            // Simulate registration logic
            const { email, password, name } = req.body;

            // Check if email already exists
            const existing = await Admin.findOne({ where: { email } });
            if (existing) {
                return res.status(409).json({ message: 'Email already registered.' });
            }
            const admin = await Admin.create({ email, name, password: password });

            return res.status(201).json({ message: 'Admin registered successfully.' });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    },
    signIn: async function(req, res) {
        try {
            const { email, password } = req.body;
            const admin = await Admin.findOne({ where: { email } });
            if (!admin) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }
            // You can set session or JWT here if needed
            const payload= {id: admin.id, email: admin.email, name: admin.name, userType: "Admin" }
            const JWT_TOKEN = utils.generateAccessToken(payload)   
            const refreshToken = utils.generateRefreshToken(payload);
        
            return res.status(200).json({
                message: 'Sign in successful.',
                token: JWT_TOKEN,
                refreshToken: refreshToken,
                user: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    userType: "Admin"
                }
            });
        } catch (error) {
            console.error('Sign in error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    }
}


module.exports = adminAuthController;