import { Logger } from '@utils/logger';
import mongoose from 'mongoose';

import { envConfig } from './env.config';

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!envConfig.mongodbUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    await mongoose.connect(envConfig.mongodbUri);

    Logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });

    mongoose.connection.on('error', (error) => {
      Logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    Logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};
