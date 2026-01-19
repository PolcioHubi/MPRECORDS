const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Podaj login i hasło'
            });
        }

        // Check user
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowe dane logowania'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Nieprawidłowe dane logowania'
            });
        }

        // Create token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Błąd serwera'
        });
    }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
exports.verify = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            role: req.user.role
        }
    });
};

// @desc    Create admin (run once)
// @route   POST /api/auth/setup
// @access  Public (only if no users exist)
exports.setup = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        
        if (userCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Admin już istnieje'
            });
        }

        const { username, password } = req.body;

        const envUsername = process.env.ADMIN_USERNAME;
        const envPassword = process.env.ADMIN_PASSWORD;

        const user = await User.create({
            username: username || envUsername || 'admin',
            password: password || envPassword || 'admin123',
            role: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Admin utworzony pomyślnie',
            user: {
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
