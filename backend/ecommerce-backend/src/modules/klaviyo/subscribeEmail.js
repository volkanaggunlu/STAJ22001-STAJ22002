const { KLAVIYO_PRIVATE_API_KEY } = require("../../config/environment");
const { formatPhone } = require("../../utils/helpers");

const EMAIL_LIST_ID = "TqetBG"

const klaviyoSubscribeEmail = async (email, phone_number) => {

    // Prepare payload for Klaviyo API
    const payload = {
        data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
                profiles: {
                    data: [
                        {
                            type: "profile",
                            attributes: {
                                email: email,
                                phone_number: phone_number ? formatPhone(phone_number) : null,
                                subscriptions: {
                                    email: {
                                        marketing: {
                                            consent: "SUBSCRIBED"
                                        }
                                    },
                                }
                            }
                        }
                    ]
                }
            },
            relationships: EMAIL_LIST_ID ? {
                list: {
                    data: {
                        type: "list",
                        id: EMAIL_LIST_ID
                    }
                }
            } : undefined
        }
    };

    // Make API request to Klaviyo
    const response = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
        method: "POST",
        headers: {
            "Authorization": `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Revision": "2024-02-15"
        },
        body: JSON.stringify(payload)
    });

    return response;
    
}

module.exports = {
    klaviyoSubscribeEmail,
}