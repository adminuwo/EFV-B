const express = require('express');
const router = express.Router();
const { Support } = require('../models');
const { protect, admin } = require('../middleware/auth');

// @desc    Submit a support message
// @route   POST /api/support/message
// @access  Public (or protected if user is logged in)
router.post('/message', async (req, res) => {
    try {
        const { name, email, subject, message, userId } = req.body;

        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        const supportMessage = await Support.create({
            userId: userId || null,
            name: name || 'Anonymous',
            email,
            subject: subject || 'No Subject',
            message,
            status: 'Open'
        });

        res.status(201).json({ message: 'Support message sent successfully', data: supportMessage });
    } catch (error) {
        console.error('Support Message Error:', error);
        res.status(500).json({ message: 'Error sending support message' });
    }
});

// @desc    Get all support messages (Admin only)
// @route   GET /api/support/messages
// @access  Private/Admin
router.get('/messages', protect, admin, async (req, res) => {
    try {
        const messages = await Support.find({});
        res.json(messages);
    } catch (error) {
        console.error('Fetch Support Messages Error:', error);
        res.status(500).json({ message: 'Error fetching support messages' });
    }
});

// @desc    Get current user's support messages
// @route   GET /api/support/my-messages
// @access  Private
router.get('/my-messages', protect, async (req, res) => {
    try {
        const messages = await Support.find({ userId: req.user._id || req.user.id });
        res.json(messages);
    } catch (error) {
        console.error('Fetch My Support Messages Error:', error);
        res.status(500).json({ message: 'Error fetching your support messages' });
    }
});

// @desc    Update support message status
// @route   PUT /api/support/messages/:id
// @access  Private/Admin
router.put('/messages/:id', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const message = await Support.findByIdAndUpdate(req.params.id, { status }, { new: true });

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json({ message: 'Message status updated', data: message });
    } catch (error) {
        console.error('Update Support Message Error:', error);
        res.status(500).json({ message: 'Error updating support message' });
    }
});

// @desc    Reply to a support message
// @route   POST /api/support/messages/:id/reply
// @access  Private/Admin
router.post('/messages/:id/reply', protect, admin, async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) return res.status(400).json({ message: 'Reply content is required' });

        const { Support, User } = require('../models');
        const message = await Support.findById(req.params.id);

        if (!message) {
            console.error(`Reply Error: Message ID ${req.params.id} not found`);
            return res.status(404).json({ message: 'Message not found' });
        }

        console.log(`Processing reply for Support ID: ${message._id || message.id}`);

        // Update Support Message
        message.reply = reply;
        message.repliedAt = new Date().toISOString();
        message.status = 'Resolved';

        // Ensure manual save for JSON DB visibility if needed, or rely on .save()
        const savedMessage = await message.save();
        console.log(`✅ Message updated with status: ${savedMessage.status}`);

        // Send Notification to User if userId exists
        if (message.userId) {
            const user = await User.findById(message.userId);
            if (user) {
                console.log(`🔔 Sending notification to User: ${user.email} (${user._id || user.id})`);
                if (!user.notifications) user.notifications = [];

                const newNotification = {
                    _id: 'reply-' + Date.now(),
                    title: 'New Support Reply',
                    message: `Admin replied to your ticket: "${message.subject}"`,
                    type: 'General',
                    link: 'profile.html?tab=support',
                    isRead: false,
                    createdAt: new Date().toISOString()
                };

                user.notifications.unshift(newNotification);
                await user.save();
                console.log("✅ User notification saved");
            } else {
                console.warn(`⚠️ User ID ${message.userId} not found for notification`);
            }
        } else {
            console.log("ℹ️ No userId on message, skipping notification");
        }

        res.json({ message: 'Reply sent successfully', data: message });
    } catch (error) {
        console.error('Support Reply Error:', error);
        res.status(500).json({ message: 'Error sending reply: ' + error.message });
    }
});

module.exports = router;
