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
 * Seeds the database with realistic demo data for product demos.
 * Only seeds if database is empty (no routines exist).
 */
export async function seedDemoData(db: SQLiteDatabase): Promise<{ success: boolean }> {
  try {
    // Check if database is empty - only seed if no routines exist
    const existingRoutines = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM routines'
    );

    if (existingRoutines && existingRoutines.count > 0) {
      console.log('Database already has routines, skipping demo data seed');
      return { success: false };
    }

    await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      let baseTimestamp = Date.now();

      // Helper function to generate a date X days ago
      const daysAgo = (days: number): string => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
      };

      // Helper function to generate random weight/reps with variation
      const randomWeight = (min: number, max: number): number => {
        return Math.round((Math.random() * (max - min) + min) / 5) * 5; // Round to nearest 5
      };

      const randomReps = (min: number, max: number): number => {
        return Math.round(Math.random() * (max - min) + min);
      };

      // Helper function to generate random duration (20-30 min)
      const randomDuration = (): number => {
        return Math.round(Math.random() * 600 + 1200); // 1200-1800 seconds
      };

      // 1. Create "Full Body A" routine
      const routineAId = `${baseTimestamp}-fullbody-a`;
      baseTimestamp += 1;
      await db.runAsync(
        `INSERT INTO routines (id, name, track, is_temporary, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [routineAId, 'Full Body A', 'FULL_BODY', 0, now, now]
      );

      // Add exercises to Full Body A
      const exercisesA = ['barbell-squat', 'bench-press', 'bent-over-row', 'hanging-leg-raise', 'bicep-curl'];
      for (let i = 0; i < exercisesA.length; i++) {
        const routineExerciseId = `${baseTimestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        baseTimestamp += 1;
        await db.runAsync(
          `INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) 
           VALUES (?, ?, ?, ?)`,
          [routineExerciseId, routineAId, exercisesA[i], i]
        );
      }

      // 2. Create "Full Body B" routine
      const routineBId = `${baseTimestamp}-fullbody-b`;
      baseTimestamp += 1;
      await db.runAsync(
        `INSERT INTO routines (id, name, track, is_temporary, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [routineBId, 'Full Body B', 'FULL_BODY', 0, now, now]
      );

      // Add exercises to Full Body B
      const exercisesB = ['deadlift', 'overhead-press', 'lat-pulldown', 'face-pull'];
      for (let i = 0; i < exercisesB.length; i++) {
        const routineExerciseId = `${baseTimestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        baseTimestamp += 1;
        await db.runAsync(
          `INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) 
           VALUES (?, ?, ?, ?)`,
          [routineExerciseId, routineBId, exercisesB[i], i]
        );
      }

      // 3. Create 8 workouts over the past 3 weeks
      // Full Body A workouts: 21, 17, 10, 3 days ago
      // Full Body B workouts: 19, 14, 7, 5 days ago
      const workoutDates = [
        { routineId: routineAId, daysBack: 21 },
        { routineId: routineBId, daysBack: 19 },
        { routineId: routineAId, daysBack: 17 },
        { routineId: routineBId, daysBack: 14 },
        { routineId: routineAId, daysBack: 10 },
        { routineId: routineBId, daysBack: 7 },
        { routineId: routineBId, daysBack: 5 },
        { routineId: routineAId, daysBack: 3 },
      ];

      // Exercise weight ranges (base weight increases slightly over time)
      const getWeightForExercise = (exerciseId: string, workoutIndex: number): number | null => {
        const progressionFactor = 1 + (workoutIndex * 0.02); // 2% increase per workout
        
        switch (exerciseId) {
          case 'barbell-squat':
            return randomWeight(205 * progressionFactor, 225 * progressionFactor);
          case 'bench-press':
            return randomWeight(155 * progressionFactor, 185 * progressionFactor);
          case 'bent-over-row':
            return randomWeight(135 * progressionFactor, 155 * progressionFactor);
          case 'bicep-curl':
            return randomWeight(30 * progressionFactor, 40 * progressionFactor);
          case 'deadlift':
            return randomWeight(245 * progressionFactor, 275 * progressionFactor);
          case 'overhead-press':
            return randomWeight(95 * progressionFactor, 115 * progressionFactor);
          case 'face-pull':
            return randomWeight(40 * progressionFactor, 60 * progressionFactor);
          case 'lat-pulldown':
            return randomWeight(120 * progressionFactor, 140 * progressionFactor);
          case 'hanging-leg-raise':
            return null; // Bodyweight exercises
          default:
            return null;
        }
      };

      const getRepsForExercise = (exerciseId: string): number => {
        switch (exerciseId) {
          case 'barbell-squat':
            return randomReps(5, 6);
          case 'bench-press':
            return randomReps(5, 8);
          case 'deadlift':
            return randomReps(3, 5);
          case 'overhead-press':
            return randomReps(6, 8);
          case 'bent-over-row':
            return randomReps(8, 10);
          case 'lat-pulldown':
            return randomReps(8, 10);
          case 'bicep-curl':
            return randomReps(10, 12);
          case 'face-pull':
            return randomReps(12, 15);
          case 'hanging-leg-raise':
            return randomReps(8, 12);
          default:
            return randomReps(8, 12);
        }
      };

      for (let workoutIndex = 0; workoutIndex < workoutDates.length; workoutIndex++) {
        const { routineId, daysBack } = workoutDates[workoutIndex];
        const workoutDate = daysAgo(daysBack);
        const workoutId = `${baseTimestamp}-workout-${workoutIndex}`;
        baseTimestamp += 1;

        // Get routine name
        const routineName = routineId === routineAId ? 'Full Body A' : 'Full Body B';
        const exercises = routineId === routineAId ? exercisesA : exercisesB;

        // Insert workout
        await db.runAsync(
          `INSERT INTO workouts (id, date, name, duration_seconds, routine_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [workoutId, workoutDate, routineName, randomDuration(), routineId]
        );

        // Create sets for each exercise (2-3 sets per exercise)
        for (const exerciseId of exercises) {
          const numSets = Math.random() > 0.3 ? 3 : 2; // 70% chance of 3 sets, 30% chance of 2 sets

          for (let setIndex = 0; setIndex < numSets; setIndex++) {
            const setId = `${baseTimestamp}-set-${setIndex}`;
            baseTimestamp += 1;

            const weight = getWeightForExercise(exerciseId, workoutIndex);
            const reps = getRepsForExercise(exerciseId);
            const timestamp = new Date(workoutDate).toISOString();

            await db.runAsync(
              `INSERT INTO sets (id, workout_id, exercise_id, weight, reps, completed, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [setId, workoutId, exerciseId, weight, reps, 1, timestamp]
            );
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  }
}

/**
 * Estimates the duration of a routine in seconds.
 * First checks historical workout data for average duration.
 * Falls back to 25 minutes (1500 seconds) if no history exists.
 */
export async function getRoutineDurationEstimate(
  db: SQLiteDatabase,
  routineId: string
): Promise<number> {
  try {
    // Get average duration from past workouts of this routine
    const result = await db.getFirstAsync<{ avg_duration: number | null }>(
      `SELECT AVG(duration_seconds) as avg_duration 
       FROM workouts 
       WHERE routine_id = ? AND duration_seconds IS NOT NULL`,
      [routineId]
    );
    
    // If no history, estimate 25 minutes (1500 seconds)
    return result?.avg_duration ? Math.round(result.avg_duration) : 1500;
  } catch (error) {
    console.error('Error getting routine duration estimate:', error);
    // Return a safe default if there's an error
    return 1500;
  }
}

