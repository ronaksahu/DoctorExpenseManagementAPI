const Admin = require("../../model/admin");
const bcrypt = require('bcrypt');
const utils = require("../../utility/utils");
const PasswordReset = require("../../model/passwordReset");
const { Op } = require('sequelize');

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
    },
    sendOtp: async function(req, res) {
        try {
            const { email } = req.body;
            const admin = await Admin.findOne({ where: { email } });
            if (!admin) {
                return res.status(404).json({ message: 'Admin not found.' });
            }

            // Generate OTP
            const otp = utils.generateOTP();

            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            // Save OTP in password_resets table
            await PasswordReset.create({
                email,
                otp,
                expires_at: expiresAt,
                used: false
            });  

            // Send OTP via email
            const emailResponse = await utils.sendMail(email, otp);

            if (emailResponse.status === 'success') {
                return res.status(200).json({ message: 'OTP sent successfully.', emailResponse });
            } else {
                return res.status(500).json({ message: 'Failed to send OTP.', emailResponse });
            }            

        } catch (error) {
            console.error('Send OTP error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }   
    },
    changePassword: async function(req, res) {
        try {
            const { email, otp, newPassword } = req.body;
            // Validate OTP
            const passwordReset = await PasswordReset.findOne({
                where: {
                    email,
                    otp,
                    used: false,
                    expires_at: { [Op.gt]: new Date() } // Check if OTP is still valid
                }
            });
            if (!passwordReset) {
                return res.status(400).json({ message: 'Invalid OTP.' });
            }       
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            // Update admin's password
            await Admin.update({ password: hashedPassword }, { where: { email } });
            // Mark OTP as used
            await passwordReset.update({ used: true });
            return res.status(200).json({ message: 'Password changed successfully.' });
        } catch (error) {
            console.error('Change password error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    }
}


module.exports = adminAuthController;