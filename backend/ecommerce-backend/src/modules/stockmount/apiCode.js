const axios = require('axios');
const logger = require('../../logger/logger');
const { STOCKMOUNT_API_URL, STOCKMOUNT_API_KEY, STOCKMOUNT_API_PASSWORD } = require('../../config/environment');

let apiCodeCache = null;

async function fetchApiCode() {
    logger.verbose('Fetching new StockMount ApiCode...');
    try {
        const response = await axios.post(`${STOCKMOUNT_API_URL}/user/dologin`, {
            apiKey: STOCKMOUNT_API_KEY,
            apiPassword: STOCKMOUNT_API_PASSWORD,
        });

        logger.debug(`StockMount ApiCode response: ${JSON.stringify(response.data)}`);

        return response.data.Response.ApiCode;
    } catch (error) {
        throw error;
    }

}

async function getApiCode() {
    // If we already have a cached apiCode, return it
    if (apiCodeCache) return apiCodeCache;

    // Otherwise fetch a new one and store it
    apiCodeCache = await fetchApiCode();
    return apiCodeCache;
}

async function callStockAPI(endpoint, data) {
    logger.verbose(`Calling StockMount API endpoint: ${endpoint}`);
    const code = await getApiCode();

    try {
        const response = await axios.post(`${STOCKMOUNT_API_URL}/${endpoint}`, {
            apiCode: code,
            ...data,
        });
        logger.debug(`StockMount API response: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        // if the error indicates the code has expired ("00006"), fetch a new code
        if (error.response && error.response.data.errorCode === '00006') {
            logger.info('StockMount ApiCode expired, fetching a new one...');
            apiCodeCache = null; // reset the cache
            return callStockAPI(endpoint, data); // retry the request with new ApiCode
        }
        throw error; // re-throw for any other errors
    }
}

module.exports = {
    callStockAPI,
};



