import { LoggerService, LogLevel } from '@nestjs/common';
import { Logger } from 'pino';

import { createLogger } from './logger';

const nestToPinoLevel: Record<LogLevel, Logger['level']> = {
  log: 'info',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
  verbose: 'trace',
  fatal: 'fatal',
};

export class NestPinoLogger implements LoggerService {
  private logger: Logger;

  constructor(context = 'api') {
    this.logger = createLogger(context);
  }

  private getScopedLogger(context?: string): Logger {
    return context ? this.logger.child({ context }) : this.logger;
  }

  log(message: any, context?: string) {
    this.getScopedLogger(context).info(message);
  }

  error(message: any, trace?: string, context?: string) {
    this.getScopedLogger(context).error({ trace }, message);
  }

  warn(message: any, context?: string) {
    this.getScopedLogger(context).warn(message);
  }

  debug?(message: any, context?: string) {
    this.getScopedLogger(context).debug(message);
  }

  verbose?(message: any, context?: string) {
    this.getScopedLogger(context).trace(message);
  }

  fatal?(message: any, context?: string) {
    this.getScopedLogger(context).fatal(message);
  }

  setLogLevels?(levels: LogLevel[]) {
    if (!levels.length) return;

    const orderedNestLevels: LogLevel[] = [
      'fatal',
      'error',
      'warn',
      'log',
      'debug',
      'verbose',
    ];
    const firstEnabled = orderedNestLevels.find((level) =>
      levels.includes(level),
    );

    if (firstEnabled) {
      this.logger.level = nestToPinoLevel[firstEnabled];
    }
  }
}
