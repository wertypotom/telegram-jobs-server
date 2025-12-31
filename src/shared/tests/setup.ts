import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Logger } from '@utils/logger';

let mongoServer: MongoMemoryServer;

// Increase timeout for downloading MongoDB binary
jest.setTimeout(30000);

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

beforeEach(async () => {
  // Mute logger during tests to keep output clean
  // We use beforeEach because restoreMocks: true in jest.config.ts restores spies between tests
  jest.spyOn(Logger, 'info').mockImplementation(() => {});
  jest.spyOn(Logger, 'error').mockImplementation(() => {});
  jest.spyOn(Logger, 'warn').mockImplementation(() => {});
  jest.spyOn(Logger, 'debug').mockImplementation(() => {});

  // Optionally silence console.error/warn directly if Logger is bypassed
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear all collections after each test to ensure isolation
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
  // No need for jest.clearAllMocks() as clearMocks: true is in jest.config.ts
});
