const Email = require('../models/email.js');

const { ValidationError } = require('../errors/errors.js');

const logger = require('../logger/logger');

const { EMAIL_REGEX } = require('../utils/constants.js');
const { klaviyoSubscribeEmail } = require('../modules/klaviyo/subscribeEmail.js');
const { formatPhone } = require('../utils/helpers.js');

const createEmail = async (req, res, next) => {
    logger.verbose('Entering createEmail');
    try {
        const { email } = req.body;
        const { trackCookie } = req;

        if (!EMAIL_REGEX.test(email)) {
            throw new ValidationError('Email is not valid');
        }

        const existingEmail = await Email.findOne({ email, trackCookie });
        if (existingEmail) {
            throw new ValidationError(`Email with email ${email} and trackCookie ${trackCookie} already exists`);
        } else {
            const email = new Email({ email, trackCookie });
            await email.save();
            logger.info(`Created Email with email: ${email}`);
            res.status(201).json({ message: 'Email created successfully' });
        }
    } catch (error) {
        next(error);
    }
};

const subscribeEmailKlaviyo = async (req, res, next) => {
    logger.verbose('Entering subscribeEmailKlaviyo')
    try {
        const { email, phone_number } = req.body;
        logger.debug('EMAIL -', email)
        // Validate email format
        if (!email || !EMAIL_REGEX.test(email)) {
            const success = false;
            const message = "Geçerli bir email adresi giriniz."
            logger.verbose(`Exiting subscribeEmailKlaviyo with success: ${success}, message: ${message}`)
            return res.status(400).json(
                { success: success, message: message },
            );
        }
        
        const response = await klaviyoSubscribeEmail(email, phone_number)

        // Get the raw response text first
        const responseText = await response.text();

        // Only try to parse as JSON if there's content to parse
        let data = {};
        if (responseText && responseText.trim()) {
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                logger.warn(`Failed to parse Klaviyo response as JSON for product ${product.name}: ${responseText}`);
                // Continue with empty data object, don't throw an error
            }
        }

        if (!response.ok) {
            const errorData = await response.json();
            const success = false;
            const message = "Abonelik işlemi sırasında bir hata oluştu."
            logger.error("Klaviyo subscription error:", errorData);
            logger.verbose(`Exiting subscribeEmailKlaviyo with success: ${success}, message: ${message}`)
            return res.status(500).json(
                { success: success, message: message },
            );
        }

        logger.info(`Successfully subscribed email: ${email}`);
        const success = true;
        const message = "Başarıyla eposta hizmetimize abone oldunuz."
        logger.verbose(`Exiting subscribeEmailKlaviyo with success: ${success}, message: ${message}`)
        return res.status(200).json(
            { success: success, message: message, data },
        );
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createEmail,
    subscribeEmailKlaviyo,
}