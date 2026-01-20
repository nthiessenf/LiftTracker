import { TRAINING_TRACKS } from '@/data/tracks';
import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Helper function to check if a column exists in a table
 * Makes migrations idempotent by checking before adding columns
 */
async function columnExists(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const result = await db.getAllAsync<{ name: string }>(
      `PRAGMA table_info(${tableName})`
    );
    return result.some((col) => col.name === columnName);
  } catch (error) {
    console.error(`Error checking column ${columnName} in ${tableName}:`, error);
    return false;
  }
}

/**
 * Helper function to safely add a column if it doesn't exist
 */
async function addColumnIfNotExists(
  db: SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string
): Promise<void> {
  const exists = await columnExists(db, tableName, columnName);
  if (!exists) {
    await db.execAsync(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
    );
  }
}

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
          updated_at TEXT NOT NULL,
          is_temporary INTEGER DEFAULT 0,
          track TEXT
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

    // Migration 2: Add routine_id column to workouts table (idempotent)
    // This migration is safe to run multiple times - checks if column exists first
    if (currentVersion < 2) {
      await addColumnIfNotExists(db, 'workouts', 'routine_id', 'TEXT');

      // Set database version
      await db.execAsync('PRAGMA user_version = 2;');
    } else {
      // Even if version is >= 2, ensure the column exists (handles partially migrated databases)
      await addColumnIfNotExists(db, 'workouts', 'routine_id', 'TEXT');
    }

    // Migration 3: Add is_temporary column to routines table (idempotent)
    // This ensures existing databases get the is_temporary column
    // Safe to run even if column already exists
    await addColumnIfNotExists(db, 'routines', 'is_temporary', 'INTEGER DEFAULT 0');

    // Migration 4: Add track column to routines table (idempotent)
    // This tracks which training track a routine belongs to (FULL_BODY, PPL, UPPER_LOWER, or NULL)
    if (currentVersion < 4) {
      await addColumnIfNotExists(db, 'routines', 'track', 'TEXT');
      await db.execAsync('PRAGMA user_version = 4;');
    } else {
      // Even if version is >= 4, ensure the column exists
      await addColumnIfNotExists(db, 'routines', 'track', 'TEXT');
    }
  } catch (error) {
    console.error('Database migration error:', error);
    throw error;
  }
}

export async function updateWorkoutDetails(
  db: SQLiteDatabase,
  workoutId: string,
  name: string | null,
  date: string
): Promise<void> {
  try {
    // Save the date string directly without any conversion
    // date should be in YYYY-MM-DD format
    console.log('updateWorkoutDetails: Saving date string directly:', date);
    await db.runAsync('UPDATE workouts SET name = ?, date = ? WHERE id = ?', [name, date, workoutId]);
    console.log('updateWorkoutDetails: Database update completed');
  } catch (error) {
    console.error('Error updating workout details:', error);
    throw error;
  }
}

export async function deleteWorkout(db: SQLiteDatabase, workoutId: string): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      // First, delete all sets for this workout
      await db.runAsync('DELETE FROM sets WHERE workout_id = ?', [workoutId]);
      // Second, delete the workout
      await db.runAsync('DELETE FROM workouts WHERE id = ?', [workoutId]);
    });
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

export async function updateSet(
  db: SQLiteDatabase,
  setId: string,
  weight: number | null,
  reps: number | null,
  completed: number
): Promise<void> {
  console.log('DB: Attempting to update set', setId, 'Weight:', weight, 'Reps:', reps, 'Completed:', completed);
  try {
    const sql = 'UPDATE sets SET weight = ?, reps = ?, completed = ? WHERE id = ?';
    const params = [weight, reps, completed, setId];
    console.log('DB: SQL Query:', sql);
    console.log('DB: Parameters:', params);
    
    const result = await db.runAsync(sql, params);
    console.log('DB: Update SUCCESS for set', setId, 'Result:', result);
  } catch (error) {
    console.error('DB: Update FAILED for set', setId, 'Error:', error);
    throw error;
  }
}

export async function deleteSet(db: SQLiteDatabase, setId: string): Promise<void> {
  try {
    await db.runAsync('DELETE FROM sets WHERE id = ?', [setId]);
  } catch (error) {
    console.error('Error deleting set:', error);
    throw error;
  }
}

export async function seedDatabaseWithTrack(db: SQLiteDatabase, trackKey: string): Promise<{ success: boolean }> {
  try {
    const track = TRAINING_TRACKS[trackKey];
    if (!track) {
      throw new Error(`Training track '${trackKey}' not found`);
    }

    // Check if routines for THIS track already exist (prevent duplicate seeding)
    // This allows seeding different tracks if user resets and picks a different one
    const existingTrackRoutines = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM routines WHERE track = ? AND is_temporary = 0',
      [trackKey]
    );

    if (existingTrackRoutines && existingTrackRoutines.count > 0) {
      console.log(`Routines for track '${trackKey}' already exist, skipping seed`);
      return { success: true };
    }

    await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      let baseTimestamp = Date.now();

      // Loop through each routine in the track
      for (const routine of track.routines) {
        // Generate a unique routine ID
        const routineId = `${baseTimestamp}-${Math.random().toString(36).substr(2, 9)}`;
        baseTimestamp += 1; // Increment to ensure uniqueness

        // Insert routine into routines table with track
        await db.runAsync(
          'INSERT INTO routines (id, name, created_at, updated_at, track) VALUES (?, ?, ?, ?, ?)',
          [routineId, routine.name, now, now, trackKey]
        );
        console.log('DEBUG: Seeded routine with track:', trackKey, 'name:', routine.name);

        // Loop through exercises and insert into routine_exercises
        for (let i = 0; i < routine.exerciseIds.length; i++) {
          const exerciseId = routine.exerciseIds[i];
          const routineExerciseId = `${baseTimestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
          baseTimestamp += 1; // Increment to ensure uniqueness

          await db.runAsync(
            'INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES (?, ?, ?, ?)',
            [routineExerciseId, routineId, exerciseId, i]
          );
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error seeding database with track:', error);
    throw error;
  }
}

/**
 * Estimates the duration of a routine in seconds.
 * First checks historical workout data for average duration.
 * Falls back to estimating based on exercise count (5 minutes per exercise).
 */
export async function getRoutineDurationEstimate(
  db: SQLiteDatabase,
  routineId: string
): Promise<number> {
  try {
    // Step 1: Check history - get average duration from workouts
    const historyResult = await db.getFirstAsync<{ avg_time: number | null }>(
      'SELECT AVG(duration_seconds) as avg_time FROM workouts WHERE routine_id = ?',
      [routineId]
    );

    // If we have historical data and it's valid, return it
    if (historyResult && historyResult.avg_time !== null && historyResult.avg_time > 0) {
      return Math.round(historyResult.avg_time);
    }

    // Step 2: Fallback - count exercises and estimate 5 minutes per exercise
    const exerciseCountResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM routine_exercises WHERE routine_id = ?',
      [routineId]
    );

    const exerciseCount = exerciseCountResult?.count || 0;
    return exerciseCount * 300; // 300 seconds = 5 minutes per exercise
  } catch (error) {
    console.error('Error getting routine duration estimate:', error);
    // Return a safe default if there's an error
    return 0;
  }
}

