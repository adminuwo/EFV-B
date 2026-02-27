const express = require("express");
const router = express.Router();
const axios = require("axios");

console.log("🚚 NimbusShipping.js Loaded");

// Delivery Serviceability Check (Phase 1)
router.post("/check-delivery", async (req, res) => {
    try {
        const { pickup_pincode, delivery_pincode, weight, order_amount } = req.body;

        // Convert weight to grams and ensure it is an integer as per Nimbus requirement
        const weightInGrams = Math.round(parseFloat(weight) * 1000);

        const response = await axios.post(
            "https://api.nimbuspost.com/v1/courier/serviceability",
            {
                origin: pickup_pincode || "482001",
                destination: delivery_pincode,
                payment_type: "prepaid",
                order_amount: order_amount || 100,
                weight: weightInGrams
            },
            {
                headers: {
                    Authorization: `Bearer ${global.nimbusToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        console.log("Serviceability Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Nimbus serviceability failed", details: error.response?.data });
    }
});

// Track Shipment (Phase 3)
router.get("/track/:awb", async (req, res) => {
    try {
        const { awb } = req.params;
        const nimbusPostService = require('../services/nimbusPostService');

        const result = await nimbusPostService.trackShipment(awb);
        res.json(result);
    } catch (error) {
        console.error("Tracking Route Error:", error.message);
        res.status(500).json({ error: "Failed to fetch tracking info" });
    }
});

module.exports = router;