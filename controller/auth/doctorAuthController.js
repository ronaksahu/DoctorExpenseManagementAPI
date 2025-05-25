const Doctor = require("../../model/doctor");
const bcrypt = require('bcrypt');
const utils = require("../../utility/utils");
// This controller handles doctor registration and sign-in


var doctorAuthController = {
    register: async function(req, res) {
        try {
            const { name, email, password, degree, contact_no, specialty } = req.body;

            // Check if email already exists
            const existing = await Doctor.findOne({ where: { email } });
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
    }
}


module.exports = doctorAuthController;