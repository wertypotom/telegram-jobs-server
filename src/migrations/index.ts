import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { envConfig } from '@config/env.config';
import { Logger } from '@utils/logger';
import { MigrationLogger } from './migration-logger';
import { Migration } from './types';

// Import all migrations
import { migration001 } from './versions/001-add-viewed-jobs-field';
import { migration002 } from './versions/002-update-schemas';

// Register migrations in order
const migrations: Migration[] = [migration001, migration002];

export class MigrationRunner {
  private logger: MigrationLogger;

  constructor() {
    this.logger = new MigrationLogger();
  }

  async run(): Promise<void> {
    try {
      // Connect to MongoDB
      await mongoose.connect(envConfig.mongodbUri);
      Logger.info('Connected to MongoDB for migrations');

      // Load migration log
      await this.logger.load();
      const lastVersion = this.logger.getLastVersion();
      Logger.info(`Last applied migration version: ${lastVersion}`);

      // Find pending migrations
      const pendingMigrations = migrations.filter(
        (m) => m.version > lastVersion
      );

      if (pendingMigrations.length === 0) {
        Logger.info('✅ No pending migrations');
        await mongoose.disconnect();
        return;
      }

      Logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

      // Run each pending migration
      for (const migration of pendingMigrations) {
        Logger.info(
          `Running migration ${migration.version}: ${migration.name}`
        );

        try {
          await migration.up();

          await this.logger.recordMigration({
            version: migration.version,
            name: migration.name,
            appliedAt: new Date().toISOString(),
            status: 'success',
          });

          Logger.info(
            `✅ Migration ${migration.version} completed successfully`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          await this.logger.recordMigration({
            version: migration.version,
            name: migration.name,
            appliedAt: new Date().toISOString(),
            status: 'failed',
            error: errorMessage,
          });

          Logger.error(`❌ Migration ${migration.version} failed:`, error);
          throw error; // Stop on first failure
        }
      }

      Logger.info('✅ All migrations completed successfully');
      await mongoose.disconnect();
      Logger.info('Disconnected from MongoDB');
    } catch (error) {
      Logger.error('Migration runner failed:', error);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  async rollback(targetVersion?: number): Promise<void> {
    try {
      await mongoose.connect(envConfig.mongodbUri);
      Logger.info('Connected to MongoDB for rollback');

      await this.logger.load();
      const currentVersion = this.logger.getLastVersion();
      const rollbackTo = targetVersion ?? currentVersion - 1;

      if (rollbackTo >= currentVersion) {
        Logger.info('Nothing to roll back');
        await mongoose.disconnect();
        return;
      }

      Logger.info(
        `Rolling back from version ${currentVersion} to ${rollbackTo}`
      );

      // Get migrations to rollback (in reverse order)
      const migrationsToRollback = migrations
        .filter((m) => m.version > rollbackTo && m.version <= currentVersion)
        .reverse();

      for (const migration of migrationsToRollback) {
        if (!migration.down) {
          Logger.warn(
            `Migration ${migration.version} has no rollback function`
          );
          continue;
        }

        Logger.info(
          `Rolling back migration ${migration.version}: ${migration.name}`
        );
        await migration.down();
        Logger.info(`✅ Rolled back migration ${migration.version}`);
      }

      await mongoose.disconnect();
      Logger.info('Rollback completed');
    } catch (error) {
      Logger.error('Rollback failed:', error);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  async status(): Promise<void> {
    await this.logger.load();

    console.log('\n📊 Migration Status\n');
    console.log(`Last applied version: ${this.logger.getLastVersion()}`);
    console.log(`Total migrations available: ${migrations.length}\n`);

    console.log('Migration History:');
    const history = this.logger.getAllMigrations();

    if (history.length === 0) {
      console.log('  No migrations applied yet\n');
    } else {
      history.forEach((entry) => {
        const status = entry.status === 'success' ? '✅' : '❌';
        console.log(
          `  ${status} v${entry.version}: ${entry.name} (${entry.appliedAt})`
        );
        if (entry.error) {
          console.log(`     Error: ${entry.error}`);
        }
      });
      console.log('');
    }

    const pending = migrations.filter(
      (m) => m.version > this.logger.getLastVersion()
    );
    if (pending.length > 0) {
      console.log('Pending migrations:');
      pending.forEach((m) => {
        console.log(`  ⏳ v${m.version}: ${m.name}`);
      });
      console.log('');
    }
  }
}

// CLI interface
const command = process.argv[2];

async function main() {
  const runner = new MigrationRunner();

  switch (command) {
    case 'up':
    case 'run':
      await runner.run();
      break;
    case 'down':
    case 'rollback':
      const version = process.argv[3] ? parseInt(process.argv[3]) : undefined;
      await runner.rollback(version);
      break;
    case 'status':
      await runner.status();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run migrate up       - Run pending migrations');
      console.log(
        '  npm run migrate down [v] - Rollback to version (default: previous)'
      );
      console.log('  npm run migrate status   - Show migration status');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
