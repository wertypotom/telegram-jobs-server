import mongoose from 'mongoose';

describe('Test Infrastructure', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should connect to in-memory database', async () => {
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should perform database operations', async () => {
    const TestSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model('Test', TestSchema);

    await TestModel.create({ name: 'jest-test' });
    const found = await TestModel.findOne({ name: 'jest-test' });

    expect(found).toBeDefined();
    expect(found?.name).toBe('jest-test');
  });
});
