import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  try {
    // Check current database version
    const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = result?.user_version || 0;

    // If version is 0, run initial migration
    if (currentVersion === 0) {
      // Create routines table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS routines (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // Create routine_exercises table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS routine_exercises (
          id TEXT PRIMARY KEY,
          routine_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
        );
      `);

      // Create workouts table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          name TEXT,
          duration_seconds INTEGER
        );
      `);

      // Create sets table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sets (
          id TEXT PRIMARY KEY,
          workout_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          weight REAL,
          reps REAL,
          completed INTEGER NOT NULL DEFAULT 0,
          timestamp TEXT,
          FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
        );
      `);

      // Create indices
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
        CREATE INDEX IF NOT EXISTS idx_sets_workout_id ON sets(workout_id);
        CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
      `);

      // Set database version
      await db.execAsync('PRAGMA user_version = 1;');
    }
  } catch (error) {
    console.error('Database migration error:', error);
    throw error;
  }
}

