require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDB();
        
        // Start server
        app.listen(PORT, () => {
            console.log('========================================');
            console.log(`🎵 MP RECORDS Server`);
            console.log('========================================');
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌍 URL: http://localhost:${PORT}`);
            console.log(`👤 Admin: http://localhost:${PORT}/admin`);
            console.log(`📊 API: http://localhost:${PORT}/api`);
            console.log('========================================');
            console.log('🚀 Server uruchomiony pomyślnie!');
            console.log('========================================');
        });
    } catch (error) {
        console.error('❌ Błąd uruchamiania serwera:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('❌ Unhandled Rejection:', err.message);
    // Close server & exit
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    process.exit(1);
});

startServer();
