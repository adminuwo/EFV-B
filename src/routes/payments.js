const express = require('express');
const router = express.Router();
const { Payment, Order } = require('../models');
const adminAuth = require('../middleware/adminAuth');

// Get all payments (Admin Only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const payments = await Payment.find().sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments' });
    }
});

// Create payment record (Internal use, e.g. after order placement)
router.post('/', adminAuth, async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ message: 'Error creating payment record' });
    }
});

module.exports = router;
