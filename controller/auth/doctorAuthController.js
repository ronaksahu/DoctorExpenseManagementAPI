const Doctor = require("../../model/doctor");
const PasswordReset = require("../../model/passwordReset");
const bcrypt = require('bcrypt');
const utils = require("../../utility/utils");
const { Op } = require('sequelize');
// This controller handles doctor registration and sign-in


var doctorAuthController = {
    register: async function(req, res) {
        try {
            const { name, email, password, degree, contact_no, specialty } = req.body;

            // Check if email already exists
            const existing = await Doctor.findOne({ where: { email } });
            if(existing && existing.access_status !== 'Granted') {
                // If the email exists and access is not revoked, return an error
                return res.status(409).json({ message: 'Email already registered.' });
            }

            if (existing) {
                return res.status(400).json({ message: 'Email already registered.' });
            }
            // Create new doctor (password will be hashed by model hook)
            const doctor = await Doctor.create({
                name,
                email,
                password,
                degree,
                contact_no,
                specialty,
            });
            
            return res.status(201).json({ message: 'Doctor registered successfully.', id: doctor.id });

        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    },
    signIn: async function(req, res) {
        try {
            const { email, password } = req.body;
            const doctor = await Doctor.findOne({ where: { email } });
            if (!doctor) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            

            const isMatch = await bcrypt.compare(password, doctor.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }
            if (doctor.access_status !== 'Granted') {
                return res.status(403).json({ message: 'Access not granted. Awaiting for Admin Approval.' });
            }
            // You can set session or JWT here if needed
            const payload = {
                id: doctor.id,
                name: doctor.name,
                email: doctor.email,
                userType: "Doctor"
            };
            const JWT_TOKEN = utils.generateAccessToken(payload)
            const refreshToken = utils.generateRefreshToken(payload);

            return res.status(200).json({ 
                message: 'Sign in successful.',
                token: JWT_TOKEN,
                refreshToken: refreshToken,
                user: {
                    id: doctor.id,
                    name: doctor.name,
                    email: doctor.email,
                    degree: doctor.degree,
                    contact_no: doctor.contact_no,
                    specialty: doctor.specialty,
                    access_status: doctor.access_status,
                    userType: "Doctor"
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
            const doctor = await Doctor.findOne({ where: { email } });
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found.' });
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
            // Update doctor's password
            await Doctor.update({ password: hashedPassword }, { where: { email } });
            // Mark OTP as used
            await passwordReset.update({ used: true });
            return res.status(200).json({ message: 'Password changed successfully.' });
        } catch (error) {
            console.error('Change password error:', error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
    }
}


module.exports = doctorAuthController;