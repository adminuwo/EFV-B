const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { AudiobookProgress, DigitalLibrary } = require('../models');

// GET progress for an audiobook
router.get('/:productId', protect, async (req, res) => {
    try {
        const progress = await AudiobookProgress.findOne({
            userId: req.user._id,
            productId: req.params.productId
        });

        if (!progress) {
            return res.json({
                currentChapterIndex: 0,
                currentChapterTime: 0,
                chapters: [],
                totalCompletedChapters: 0
            });
        }
        res.json(progress);
    } catch (error) {
        console.error('Error fetching audiobook progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// UPSET progress for a specific chapter
router.post('/:productId', protect, async (req, res) => {
    try {
        const { chapterIndex, currentTime, duration, completed } = req.body;
        const productId = req.params.productId;
        const userId = req.user._id;

        let progress = await AudiobookProgress.findOne({ userId, productId });

        if (!progress) {
            progress = new AudiobookProgress({
                userId,
                productId,
                chapters: [],
                currentChapterIndex: chapterIndex,
                currentChapterTime: currentTime
            });
        }

        // Find or create the chapter entry
        let chapterEntry = progress.chapters.find(c => c.chapterIndex === chapterIndex);
        if (!chapterEntry) {
            chapterEntry = { chapterIndex, currentTime, duration, completed };
            progress.chapters.push(chapterEntry);
        } else {
            chapterEntry.currentTime = currentTime;
            chapterEntry.duration = duration;
            if (completed) chapterEntry.completed = true;
            chapterEntry.lastUpdated = Date.now();
        }

        // Update overall progress
        progress.currentChapterIndex = chapterIndex;
        progress.currentChapterTime = currentTime;
        progress.totalCompletedChapters = progress.chapters.filter(c => c.completed).length;
        progress.lastUpdated = Date.now();

        await progress.save();

        // Sync with DigitalLibrary for easy dashboard access
        const library = await DigitalLibrary.findOne({ userId });
        if (library) {
            const item = library.items.find(i => i.productId.toString() === productId);
            if (item) {
                item.lastChapter = chapterIndex;
                item.lastChapterTime = currentTime;
                // Calculate overall percentage
                // This is a bit complex if we don't know total chapters here, 
                // but we can at least store the last chapter info
                await library.save();
            }
        }

        res.json({ success: true, data: progress });
    } catch (error) {
        console.error('Error saving audiobook progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
