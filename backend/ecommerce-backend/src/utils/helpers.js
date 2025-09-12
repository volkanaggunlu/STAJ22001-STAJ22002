const { API_BASE_URL } = require('../config/environment');
let _slugify = require('slugify');

const getTurkeyTimeISO = () => {
    const now = new Date();

    // Convert current UTC time to Turkey Time (UTC+3)
    now.setUTCHours(now.getUTCHours() + 3);

    return now.toISOString().replace('Z', '+03:00'); // Keep ISO format but set correct offset
};

function formatPhone(phoneNumber) {
    // Remove all non-digit characters except the leading plus sign
    let formattedNumber = phoneNumber.replace(/[^\d+]/g, '');

    // If number doesn't start with +, assume it needs formatting
    if (!formattedNumber.startsWith('+')) {
        // Check if it starts with 0 (local format)
        if (formattedNumber.startsWith('0')) {
            formattedNumber = formattedNumber.substring(1);
        }
        // Check if it already starts with country code 90
        else if (formattedNumber.startsWith('90')) {
            formattedNumber = formattedNumber.substring(2);
        }

        // Add Turkish country code
        formattedNumber = '+90' + formattedNumber;
    }

    // Final validation - should start with + followed by at least 10 digits
    if (!/^\+\d{10,15}$/.test(formattedNumber)) {
        throw new Error('Invalid phone number format after processing at formatPhone');
    }

    return formattedNumber;
}

slugify = (text) => {
    return _slugify(text, {
        lower: true,
        locale: 'tr',
    })
}

function formatImageURL(image, slug) {
    return `${API_BASE_URL}/product-images/${slug}/${image.filename}`
}

module.exports = {
    slugify,
    formatImageURL,
    getTurkeyTimeISO,
    formatPhone,
}