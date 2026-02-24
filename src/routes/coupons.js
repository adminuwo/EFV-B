const express = require('express');
const router = express.Router();
const { Coupon } = require('../models');
const adminAuth = require('../middleware/adminAuth');

// Get all coupons (Admin Only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons' });
    }
});

// Create new coupon
router.post('/', adminAuth, async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json(coupon);
    } catch (error) {
        res.status(400).json({ message: 'Error creating coupon', error: error.message });
    }
});

// Delete coupon
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting coupon' });
    }
});

// Verify coupon (Public)
router.post('/verify', async (req, res) => {
    const { code, amount } = req.body;
    try {
        const coupon = await Coupon.findOne({ code, isActive: true });
        if (!coupon) return res.status(404).json({ message: 'Invalid or inactive coupon' });

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        if (amount < (coupon.minOrder || 0)) {
            return res.status(400).json({ message: `Minimum order of ₹${coupon.minOrder} required` });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Error verifying coupon' });
    }
});

module.exports = router;
