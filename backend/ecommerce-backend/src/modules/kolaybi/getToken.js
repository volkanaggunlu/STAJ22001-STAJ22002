const axios = require('axios');

const logger = require('../../logger/logger')

const { API_URL } = require('./constants');
const { KOLAYBI_API_KEY, KOLAYBI_CHANNEL } = process.env;

// Token cache to avoid unnecessary API calls
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

/**
 * Returns an access token to be used in all kolaybi API calls.
 * Implements caching to avoid unnecessary API calls.
 * 
 * @param {boolean} forceRefresh - If true, forces a new token request regardless of cache
 * @returns {Promise<string>} The access token
 */
const getToken = async (forceRefresh = false) => {
    logger.verbose('entering kolaybi.getToken')
    // Check if we have a cached token that's still valid
    const now = Date.now();
    if (!forceRefresh && tokenCache.accessToken && tokenCache.expiresAt && now < tokenCache.expiresAt) {
        return tokenCache.accessToken;
    }

    try {
        const response = await axios({
            method: 'post',
            url: `${API_URL}/access_token`,
            params: {
                api_key: KOLAYBI_API_KEY
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Channel': KOLAYBI_CHANNEL
            }
        });

        // Cache the token
        // If the API doesn't return an expiry time, set a default (e.g., 50 minutes)
        const expiresIn = response.data.expires_in || 50 * 60 * 1000; // 50 minutes in milliseconds

        tokenCache = {
            accessToken: response.data.data,
            expiresAt: now + expiresIn - 60000 // Subtract 1 minute as buffer
        };

        logger.verbose('exiting kolaybi.getToken. Got token:', Boolean(tokenCache.accessToken))
        return tokenCache.accessToken;
    } catch (error) {
        console.error('Error fetching Kolaybi access token:', error.message);

        // If we have a cached token, return it as fallback even if expired
        if (tokenCache.accessToken) {
            console.warn('Using expired token as fallback');
            return tokenCache.accessToken;
        }

        throw error; // Re-throw if no fallback is available
    }
};

module.exports = { getToken };