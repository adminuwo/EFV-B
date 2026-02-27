const axios = require('axios');
const NIMBUS_BASE_URL = 'https://api.nimbuspost.com/v1';

let cachedToken = null;

/**
 * Login to NimbusPost to get API Token
 */
async function login() {
    try {
        const response = await axios.post(`${NIMBUS_BASE_URL}/users/login`, {
            email: process.env.NIMBUS_EMAIL,
            password: process.env.NIMBUS_PASSWORD
        });

        if (response.data.status && response.data.data) {
            cachedToken = response.data.data.trim();
            global.nimbusToken = cachedToken;
            return cachedToken;
        } else {
            throw new Error(response.data.message || 'NimbusPost Login Failed');
        }
    } catch (error) {
        console.error('❌ NimbusPost Login Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Create a new shipment/order in NimbusPost
 */
async function createShipment(orderData) {
    if (!cachedToken) {
        await login();
    }

    try {
        console.log('📦 Creating Nimbus Shipment with payload...', orderData.order_number);
        const response = await axios.post(`${NIMBUS_BASE_URL}/shipments`, orderData, {
            headers: {
                'Authorization': `Bearer ${cachedToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📄 Nimbus API Response Status:', response.data.status);
        return response.data;
    } catch (error) {
        // Handle Token Expired (401)
        if (error.response?.status === 401 || (error.response?.data?.message?.toLowerCase().includes('token'))) {
            console.log('🔄 Nimbus Token Expired, retrying...');
            await login();
            return createShipment(orderData);
        }

        console.error('❌ NimbusPost Create Shipment Error:', error.response?.data || error.message);
        return error.response?.data || { status: false, message: error.message };
    }
}

/**
 * Get Tracking Data for an AWB
 */
async function trackShipment(awb) {
    if (!cachedToken) {
        await login();
    }

    try {
        const response = await axios.get(`${NIMBUS_BASE_URL}/shipments/track/${awb}`, {
            headers: {
                'Authorization': `Bearer ${cachedToken}`
            }
        });

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            await login();
            return trackShipment(awb);
        }
        console.error('❌ NimbusPost Tracking Error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get Serviceability for a pincode
 */
async function checkServiceability(data) {
    if (!cachedToken) {
        await login();
    }

    try {
        const response = await axios.post(`${NIMBUS_BASE_URL}/courier/serviceability`, data, {
            headers: {
                'Authorization': `Bearer ${cachedToken}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            await login();
            return checkServiceability(data);
        }
        console.error('❌ Nimbus Serviceability Error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    login,
    trackShipment,
    createShipment,
    checkServiceability
};
