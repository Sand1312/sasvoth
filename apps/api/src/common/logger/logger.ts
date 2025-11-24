import pino, { Logger, LoggerOptions } from 'pino';

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const loggerOptions: LoggerOptions = {
  level,
  base: undefined,
};

if (process.env.NODE_ENV !== 'production') {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      singleLine: true,
    },
  };
}

export const rootLogger = pino(loggerOptions);

export const createLogger = (context?: string): Logger =>
  context ? rootLogger.child({ context }) : rootLogger;
