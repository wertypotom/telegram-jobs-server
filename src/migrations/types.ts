export interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export interface MigrationLogEntry {
  version: number;
  name: string;
  appliedAt: string;
  status: 'success' | 'failed';
  error?: string;
}

export interface MigrationLog {
  lastVersion: number;
  migrations: MigrationLogEntry[];
}
