import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { v4 as uuidv4 } from 'uuid';

import { AppConfig } from './config/app';
import { DatabaseConfig } from './config/database';
import { RedisConfig } from './config/redis';
import { Logger } from './utils/logger';
import { Routes } from './routes';
import { ErrorMiddleware } from './middleware/error.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { swaggerSpec } from './config/swagger';
import dotenv from 'dotenv';

dotenv.config();
export class App {
  private app: Application;
  private config: AppConfig;
  private database: DatabaseConfig;
  private redis: RedisConfig;
  private logger: Logger;

  constructor() {
    this.app = express();
    this.config = AppConfig.getInstance();
    this.database = DatabaseConfig.getInstance();
    this.redis = RedisConfig.getInstance();
    this.logger = Logger.getInstance();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Request ID middleware
    this.app.use((req, res, next) => {
      res.locals.requestId = uuidv4();
      next();
    });

    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: this.config.corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    this.app.use(RateLimitMiddleware.lenient);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (this.config.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        requestId: res.locals.requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // API routes
    this.app.use('/api/v1', new Routes().getRouter());

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Express TypeScript API Server',
        version: '1.0.0',
        timestamp: new Date(),
        environment: this.config.environment,
        documentation: '/api-docs',
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(ErrorMiddleware.notFound);

    // Global error handler
    this.app.use(ErrorMiddleware.handle);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.database.connect();

      // Connect to Redis
      try {
        await this.redis.connect();
      } catch (error) {
        this.logger.warn('Redis connection failed, continuing without Redis:', error);
      }

      // Start server
      this.app.listen(this.config.port, () => {
        this.logger.info(
          `Server running on port ${this.config.port} in ${this.config.environment} mode`
        );
        this.logger.info(
          `API Documentation available at http://localhost:${this.config.port}/api-docs`
        );
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      this.logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}. Starting graceful shutdown...`);

      try {
        await this.database.disconnect();
        this.logger.info('Database disconnected');

        if (this.redis.isReady()) {
          await this.redis.disconnect();
          this.logger.info('Redis disconnected');
        }

        process.exit(0);
      } catch (error) {
        this.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public getApp(): Application {
    return this.app;
  }
}
