const jwt = require('jsonwebtoken');
const { User } = require('../models');

const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No admin token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

        const adminUser = await User.findById(decoded.id);

        if (!adminUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isAdmin = adminUser.role === 'admin' || (adminUser.email && adminUser.email.toLowerCase() === 'admin@uwo24.com');

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin rights required' });
        }

        req.user = adminUser;
        req.admin = adminUser;
        next();
    } catch (error) {
        console.error('Admin Auth Error:', error);
        res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};

module.exports = adminAuth;
