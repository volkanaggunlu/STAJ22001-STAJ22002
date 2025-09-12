const axios = require('axios');
const FormData = require('form-data');

const logger = require('../../logger/logger')

const { KOLAYBI_CHANNEL } = require('../../config/environment');
const { getToken } = require('./getToken');
const { API_URL } = require('./constants');

const MAX_RETRIES = 4; // Limit retries to prevent infinite loops

const createFormData = (order) => {
    const formData = new FormData();
    formData.append('name', order.name.trim());
    formData.append('surname', order.surname.trim());
    formData.append('identity_no', '11111111111');
    formData.append('phone', order.phone.trim());
    formData.append('email', order.email.trim());
    formData.append('addresses[address]', order.address.trim());
    formData.append('addresses[city]', order.city.trim());
    formData.append('addresses[district]', order.district.trim());
    formData.append('addresses[country]', 'Türkiye');
    formData.append('tags[0]', '245690')
    return formData;
};

const makeAssociateRequest = async (order, token, attempt = 1) => {
    const formData = createFormData(order);

    try {
        const response = await axios({
            method: 'post',
            url: `${API_URL}/associates`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Channel': KOLAYBI_CHANNEL,
                'Content-Type': "multipart/form-data"
            },
            data: formData
        });

        return response.data.data;
    } catch (error) {
        logger.debug('initial makeAssociateRequest returned error: ' + JSON.stringify(error.response?.data))
        if (error.response?.status === 401 && attempt < MAX_RETRIES) {
            const newToken = await getToken(true); // Force token refresh
            return makeAssociateRequest(order, newToken, attempt + 1);
        } else if (error.response?.status === 412 && error.response?.data?.message === 'MODEL.ALREADY_EXISTS') {
            logger.debug('fetching all associates')
            const response = await axios({
                method: 'get',
                url: `${API_URL}/associates`,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Channel': KOLAYBI_CHANNEL,
                },
            });
            // logger.debug('fetched all associates:' + JSON.stringify(response.data))

            const associate = response.data.data.find(associate => associate.email?.trim() === order.email.trim().toLowerCase())
            logger.debug('found associate by fetching all associates:', associate)
            return associate
        } else if (error.response?.status === 400 && error.response?.data?.message === "GENERAL.DISTRICT_NOT_MATCH") {
            logger.error('GENERAL.DISTRICT_NOT_MATCH: ' + order.merchant_oid)
        }
        throw error;
    }
};

const createAssociate = async (order) => {
    logger.verbose('entering kolaybi.createAssociate')
    try {
        const token = await getToken();
        const result = await makeAssociateRequest(order, token);
        logger.verbose('exiting kolaybi.createAssociate')
        return result
    } catch (error) {
        if (error.response) {
            console.error('Error creating associate:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
};

module.exports = { createAssociate };