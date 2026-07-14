import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
export const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, context, ms, stack }) => {
            // 2. Check if 'stack' exists; if so, print it instead of just the message
            const displayMessage = stack || message;
            const ctx = context || 'App';

            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
            return `[${timestamp}] ${level}: [${ctx}] ${displayMessage} ${ms}`;
          },
        ),
      ),
    }),
  ],
});
