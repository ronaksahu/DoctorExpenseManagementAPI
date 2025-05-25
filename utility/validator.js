const { body, validationResult, header } = require('express-validator')


exports.adminAuthValidate = [
    body('email')
        .exists()
        .isEmail().withMessage('email should not be empty')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    },
    body('password')
        .exists()
        .isLength({min: 7}).withMessage('password length should be more then 7')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    }
]

exports.doctorRegisterAuthValidate = [
    body('email')
        .exists()
        .isEmail().withMessage('email should not be empty')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    },
    body('password')
        .exists()
        .isLength({min: 7}).withMessage('password length should be more then 7')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    },
    body('contact_no')
        .exists().withMessage('contact_no is required')
        .isMobilePhone().withMessage('contact_no must be a valid mobile number')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    }
]

exports.doctorSignInAuthValidate = [
    body('email')
        .exists()
        .isEmail().withMessage('email should not be empty')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    },
    body('password')
        .exists()
        .isLength({min: 7}).withMessage('password length should be more then 7')
        .trim(),
    function(req, res, next) {
        var errorValidation = validationResult(req);
        if(!errorValidation.isEmpty()) {
            return res.status(400).json({"message" : errorValidation.array().pop().msg});
        }
        next()
    }
]

exports.accessStatusValidate = [
    body('access_status')
        .exists().withMessage('access_status is required')
        .isIn(['Requested', 'Granted', 'Revoked']).withMessage('access_status must be Requested, Granted, or Revoked'),
    function(req, res, next) {
        const errorValidation = validationResult(req);
        if (!errorValidation.isEmpty()) {
            return res.status(400).json({ "message": errorValidation.array().pop().msg });
        }
        next();
    }
];

exports.clinicAddValidate = [
    body('name')
        .exists().withMessage('name is required')
        .isLength({ min: 2 }).withMessage('name must be at least 2 characters')
        .trim(),
    body('address')
        .exists().withMessage('address is required')
        .isLength({ min: 5 }).withMessage('address must be at least 5 characters')
        .trim(),
    body('contact_no')
        .optional()
        .isMobilePhone().withMessage('contact_no must be a valid mobile number')
        .trim(),
    function(req, res, next) {
        const errorValidation = validationResult(req);
        if (!errorValidation.isEmpty()) {
            return res.status(400).json({ "message": errorValidation.array().pop().msg });
        }
        next();
    }
];