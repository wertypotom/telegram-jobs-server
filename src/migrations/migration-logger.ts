import { Logger } from '@utils/logger';
import fs from 'fs/promises';
import path from 'path';

import { MigrationLog, MigrationLogEntry } from './types';

const LOG_FILE_PATH = path.join(__dirname, 'migration-log.json');

export class MigrationLogger {
  private log: MigrationLog;

  constructor() {
    this.log = { lastVersion: 0, migrations: [] };
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(LOG_FILE_PATH, 'utf-8');
      this.log = JSON.parse(data);
      Logger.info('Migration log loaded', { lastVersion: this.log.lastVersion });
    } catch (error) {
      // File doesn't exist yet, start fresh
      Logger.info('No existing migration log found, starting fresh');
      this.log = { lastVersion: 0, migrations: [] };
    }
  }

  async save(): Promise<void> {
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(this.log, null, 2), 'utf-8');
    Logger.info('Migration log saved');
  }

  getLastVersion(): number {
    return this.log.lastVersion;
  }

  async recordMigration(entry: MigrationLogEntry): Promise<void> {
    this.log.migrations.push(entry);
    if (entry.status === 'success') {
      this.log.lastVersion = entry.version;
    }
    await this.save();
  }

  hasMigration(version: number): boolean {
    return this.log.migrations.some((m) => m.version === version && m.status === 'success');
  }

  getAllMigrations(): MigrationLogEntry[] {
    return this.log.migrations;
  }
}
