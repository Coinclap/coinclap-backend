import { createClient, type RedisClientType } from 'redis';
import { Logger } from '../utils/logger';
import { AppConfig } from './app';

export class RedisConfig {
  private static instance: RedisConfig;
  private client: RedisClientType;
  private logger: Logger;
  private isConnected = false;

  private constructor() {
    this.logger = Logger.getInstance();
    const config = AppConfig.getInstance();
    console.log('Redis URL:', config.redisUrl);
    this.client = createClient({
      url: config.redisUrl,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisConfig {
    if (!RedisConfig.instance) {
      RedisConfig.instance = new RedisConfig();
    }
    return RedisConfig.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('error', err => {
      this.isConnected = false;
      this.logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.info('Redis Client Connected');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis Client Reconnecting');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      this.logger.info('Redis Client Connection Closed');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      this.logger.info('Redis disconnected gracefully');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public getClient(): RedisClientType {
    if (!this.isConnected) {
      this.logger.warn('Redis client is not connected. Attempting to reconnect...');
      this.connect().catch(err => {
        this.logger.error('Failed to reconnect to Redis:', err);
      });
    }
    return this.client;
  }

  public isReady(): boolean {
    return this.isConnected;
  }
}
