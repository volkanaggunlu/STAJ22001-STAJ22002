const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(
    info =>
      // https://stackoverflow.com/a/69044670/20358783 more detailLocaleString
      `${new Date(info.timestamp).toLocaleDateString('tr-Tr', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })} ${info.level.toLocaleUpperCase()}: ${info.message}`
  ),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const config = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },

  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'grey'
  },
}

// Create the logger
winston.addColors(config.colors);
const logger = winston.createLogger({
  levels: config.levels,
  level: process.env.NODE_ENV !== 'production' ? 'silly' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: `./src/logs/error.log`,
      level: 'error',
    }),
    new winston.transports.File({
      filename: `./src/logs/combined.log`,
    }),
  ]
});


// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// const logger = winston.createLogger({
//   levels,
//   level: NODE_ENV !== 'production' ? 'silly' : 'info',
//   format: logFormat,
//   transports: [
//     // Write all logs error (and below) to `error.log`
//     new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
//     // Write all logs to `combined.log`
//     new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
//   ],
// });

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => logger.http('incoming-request: ' + message.trim()),
};
module.exports = logger;