const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log for dev
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Nie znaleziono zasobu';
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        error.message = 'Duplikat wartości w bazie danych';
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error.message = messages.join(', ');
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Błąd serwera'
    });
};

module.exports = errorHandler;
