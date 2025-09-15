const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;

  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
