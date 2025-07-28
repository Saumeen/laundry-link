// Universal logger that works in both server and client environments
let logger: any;

if (typeof window === 'undefined') {
  // Server-side: Use Winston
  const winston = require('winston');

  // Define log levels
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  // Define colors for each level
  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  };

  // Tell winston that you want to link the colors
  winston.addColors(colors);

  // Define which level to log based on environment
  const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
  };

  // Define format for logs
  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info: any) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  );

  // Define transports
  const transports = [
    // Console transport
    new winston.transports.Console(),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // File transport for all logs
    new winston.transports.File({ filename: 'logs/all.log' }),
  ];

  // Create the logger
  logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
  });
} else {
  // Client-side: Use console methods with similar interface
  const isDevelopment = process.env.NODE_ENV === 'development';

  logger = {
    error: (...args: any[]) => {
      console.error(...args);
    },
    warn: (...args: any[]) => {
      console.warn(...args);
    },
    info: (...args: any[]) => {
      console.info(...args);
    },
    http: (...args: any[]) => {
      if (isDevelopment) {
        console.log('[HTTP]', ...args);
      }
    },
    debug: (...args: any[]) => {
      if (isDevelopment) {
        console.log('[DEBUG]', ...args);
      }
    },
  };
}

export default logger;
