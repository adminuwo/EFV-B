const { User } = require('./src/models');

async function test() {
    const userId = 'mlrnq3u492vak53seqk'; // Existing user from users.json
    const user = await User.findById(userId);
    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('Initial notifications count:', user.notifications.length);
    const initialNoteId = user.notifications[0]._id || user.notifications[0].id;
    console.log('Deleting notification:', initialNoteId);

    user.notifications = user.notifications.filter(n => (n._id || n.id) !== initialNoteId);
    console.log('New notifications count:', user.notifications.length);

    await user.save();
    console.log('User saved.');

    const verifyUser = await User.findById(userId);
    console.log('Verified notifications count:', verifyUser.notifications.length);
    const stillExists = verifyUser.notifications.some(n => (n._id || n.id) === initialNoteId);
    console.log('Still exists?', stillExists);

    // Restore it back for safety - no, actually don't, we want it deleted correctly.
}

test().catch(console.error);
