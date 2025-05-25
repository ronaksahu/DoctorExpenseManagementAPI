const jwt = require('jsonwebtoken');
var config = require('../config.json')

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
}

module.exports = utils;