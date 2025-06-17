import dotenv from 'dotenv';
import { App } from './app';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  const logger = Logger.getInstance();
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  const logger = Logger.getInstance();
  logger.error('Unhandled Rejection at promise', { promise, reason });
  process.exit(1);
});

// Start the application
const app = new App();
app.start().catch(error => {
  const logger = Logger.getInstance();
  logger.error('Failed to start application:', error);
  process.exit(1);
});
