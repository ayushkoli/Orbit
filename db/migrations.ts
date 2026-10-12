import type { SQLiteDatabase } from 'expo-sqlite';

export const SCHEMA_VERSION = 2;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const current = row?.user_version ?? 0;

  if (current < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        priority INTEGER NOT NULL,
        due TEXT,
        tag TEXT NOT NULL DEFAULT '',
        done INTEGER NOT NULL DEFAULT 0,
        done_at TEXT,
        created_at TEXT NOT NULL,
        reminder TEXT
      );
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        days TEXT NOT NULL,
        created_at TEXT NOT NULL,
        reminder TEXT
      );
      CREATE TABLE IF NOT EXISTS habit_logs (
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        PRIMARY KEY (habit_id, date),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  }

  if (current < 2) {
    try {
      await db.execAsync('ALTER TABLE tasks ADD COLUMN reminder TEXT;');
    } catch {
      // Column might already exist
    }
    try {
      await db.execAsync('ALTER TABLE habits ADD COLUMN reminder TEXT;');
    } catch {
      // Column might already exist
    }
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
