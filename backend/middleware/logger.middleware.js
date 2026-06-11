const fs = require('fs');
const path = require('path');

const createLogger = ({ env = 'development' } = {}) => {
  const logsDir = path.join(__dirname, '..', 'logs');

  if (env === 'production') {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

      if (env === 'production') {
        const logFile = path.join(logsDir, 'access.log');
        fs.appendFile(logFile, log + '\n', (err) => {
          if (err) console.error('Failed to write log:', err.message);
        });
      } else {
        const color =
          res.statusCode >= 500
            ? '\x1b[31m'
            : res.statusCode >= 400
            ? '\x1b[33m'
            : '\x1b[32m';
        console.log(`${color}${log}\x1b[0m`);
      }
    });

    next();
  };
};

module.exports = { createLogger };
