import winston from 'winston';
import type { LogLevel } from '../enums';
import { AppConfig } from '../config/app';

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private config: AppConfig;

  private constructor() {
    this.config = AppConfig.getInstance();
    this.logger = this.createLogger();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private createLogger(): winston.Logger {
    const format = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: this.config.isDevelopment()
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : format,
      }),
    ];

    if (this.config.isProduction()) {
      transports.push(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
      );
    }

    return winston.createLogger({
      level: this.config.logLevel,
      format,
      transports,
      exitOnError: false,
    });
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: any): void {
    this.logger.error(message, error);
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public log(level: LogLevel, message: string, meta?: any): void {
    this.logger.log(level, message, meta);
  }
}
