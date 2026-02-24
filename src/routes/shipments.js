const express = require('express');
const router = express.Router();
const { Shipment, Order } = require('../models');
const adminAuth = require('../middleware/adminAuth');

// Get all shipments (Admin Only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const shipments = await Shipment.find().sort({ createdAt: -1 });
        res.json(shipments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shipments' });
    }
});

// Update shipment status
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const shipment = await Shipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
        res.json(shipment);
    } catch (error) {
        res.status(400).json({ message: 'Error updating shipment' });
    }
});

module.exports = router;
