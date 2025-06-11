const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
var config = require('../config.json')

const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: '2010-12-01' });

const utils = {
    authenticateToken: function(req, res, next) {
        
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    return res.status(403).json({ message: 'Invalid or expired token.' });
                }
                req.user = user;
                next();
            });
        } else {
            res.status(401).json({ message: 'Authorization header missing.' });
        }
    },
    generateAccessToken: function(user) {
        return jwt.sign(user, config.JWT_ACCESS_TOKEN_SECRET);
    },
    generateRefreshToken: function(user) {
        return jwt.sign(user, config.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // long-lived
    },
    isAdmin: function(req, res, next) {

        const user = req.user
        if(user.userType != 'Admin') return res.status(401).json({ message: 'Invalid User.' });
        next();
    },
    isDoctor: function(req, res, next) {

        const user = req.user
        if(user.userType != 'Doctor') return res.status(401).json({ message: 'Invalid User.' });
        next();
    },
    generateOTP: function() {
        const otp = otpGenerator.generate(6, {alphabets: false, upperCase: false, specialChars: false});
        return otp;
    },
    sendMail: async function(email, otp) {
        const params = {
            Source: process.env.SES_FROM_EMAIL,
            Destination: {
                ToAddresses: ["ronaksahu003@gmail.com"],
            },
            Message: {
                Subject: {
                Charset: 'UTF-8',
                Data: "Doctor Expense Management - Your OTP Code for Verification",
                },
                Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `Your OTP code is <strong>${otp}</strong>. It is valid for 5 minutes.`,
                },
                },
            },
        };

        try {
            const result = await ses.sendEmail(params).promise();
            return {status: 'success', message: 'Email sent successfully.', messageId: result.MessageId };
        } catch (error) {
            console.error('SES sendEmail error:', error);
            return {status: 'error', message: 'Failed to send email', error: error.message };
        }
    }
}

module.exports = utils;