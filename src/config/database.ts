import mongoose from 'mongoose';
import { Logger } from '../utils/logger';
import { DatabaseEvents } from '../enums';
import dotenv from 'dotenv';

dotenv.config();
export class DatabaseConfig {
  private static instance: DatabaseConfig;
  private logger: Logger;
  private connectionString: string;

  private constructor() {
    this.logger = Logger.getInstance();
    this.connectionString =
      process.env.MONGODB_URI ||
      'mongodb+srv://coinclap:coinclap@cluster0.td1mmc9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  }

  public static getInstance(): DatabaseConfig {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new DatabaseConfig();
    }
    return DatabaseConfig.instance;
  }

  public async connect(): Promise<void> {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      await mongoose.connect(this.connectionString, options);

      mongoose.connection.on(DatabaseEvents.CONNECTED, () => {
        this.logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on(DatabaseEvents.ERROR, error => {
        this.logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on(DatabaseEvents.DISCONNECTED, () => {
        this.logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on(DatabaseEvents.RECONNECTED, () => {
        this.logger.info('MongoDB reconnected');
      });
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      this.logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionState(): number {
    return mongoose.connection.readyState;
  }
}
