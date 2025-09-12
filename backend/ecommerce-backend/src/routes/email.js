// src/routes/auth.js
const express = require('express');
const auth = require('../middleware/auth');

const { createEmail, subscribeEmailKlaviyo } = require('../controllers/email');

const logger = require('../logger/logger');

const router = express.Router();

router.post('/email', auth, createEmail);
router.post('/subscribeEmail', auth, subscribeEmailKlaviyo)

logger.info('E-mail routes enabled');

module.exports = router;
