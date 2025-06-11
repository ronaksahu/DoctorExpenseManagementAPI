const express = require('express')
const adminAuth = require('./auth/admin');
const doctorAuth = require('./auth/doctor');
const adminRoutes = require('./adminAuth');
const doctorRoutes = require('./doctorAuth');
var utils = require('../utility/utils')



var router = express.Router()


router.get('/status', (req, res) => {
    res.status(200).send('ok')
})

router.use('/auth/admin', adminAuth);
router.use('/auth/doctor', doctorAuth);

router.use('/admin', utils.authenticateToken, utils.isAdmin, adminRoutes);
router.use('/doctor', utils.authenticateToken, utils.isDoctor, doctorRoutes)

// Send email endpoint
router.get('/send-email', async (req, res) => {
  

  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: {
      ToAddresses: ['ronaksahu003@gmail.com'],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: "Test Subject",
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: "Hello World",
        },
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    res.json({ messageId: result.MessageId });
  } catch (error) {
    console.error('SES sendEmail error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});


module.exports = router;