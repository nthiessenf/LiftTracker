import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SQLiteDatabase } from 'expo-sqlite';

export async function exportDatabaseToJson(db: SQLiteDatabase): Promise<void> {
  try {
    // Run a single transaction to get all data
    const routines = await db.getAllAsync('SELECT * FROM routines');
    const workouts = await db.getAllAsync('SELECT * FROM workouts');
    const sets = await db.getAllAsync('SELECT * FROM sets');

    // Construct JSON object
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      routines,
      workouts,
      sets,
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(backupData, null, 2);

    // Write to file
    const fileName = 'LiftTrack_Backup.json';
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    // Share the file
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri);
    } else {
      throw new Error('Sharing is not available on this device');
    }
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
}

type BackupData = {
  version: number;
  timestamp: string;
  routines: any[];
  workouts: any[];
  sets: any[];
};

export async function importDatabaseFromJson(db: SQLiteDatabase): Promise<{ success: boolean }> {
  try {
    // Step A: Use DocumentPicker to let user pick a file
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('File picker was canceled');
    }

    const fileUri = result.assets[0].uri;

    // Step B: Read the file content
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    
    // Parse JSON
    let backupData: BackupData;
    try {
      backupData = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error('Invalid JSON file');
    }

    // Step C: Validate JSON structure
    if (!backupData.routines || !backupData.workouts || !backupData.sets) {
      throw new Error('Invalid backup file format. Missing required data arrays.');
    }

    if (!Array.isArray(backupData.routines) || !Array.isArray(backupData.workouts) || !Array.isArray(backupData.sets)) {
      throw new Error('Invalid backup file format. Data must be arrays.');
    }

    // Step D: Perform Transaction - Delete all existing data and restore
    await db.withTransactionAsync(async () => {
      // Delete all existing data (in correct order to respect foreign keys)
      await db.runAsync('DELETE FROM sets');
      await db.runAsync('DELETE FROM routine_exercises');
      await db.runAsync('DELETE FROM workouts');
      await db.runAsync('DELETE FROM routines');

      // Insert restored routines
      for (const routine of backupData.routines) {
        await db.runAsync(
          'INSERT INTO routines (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [routine.id, routine.name, routine.created_at, routine.updated_at]
        );
      }

      // Insert restored routine_exercises (if they exist in the backup)
      // Note: The export doesn't include routine_exercises, but we'll handle it if present
      if (backupData.routine_exercises && Array.isArray(backupData.routine_exercises)) {
        for (const routineExercise of backupData.routine_exercises) {
          await db.runAsync(
            'INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES (?, ?, ?, ?)',
            [routineExercise.id, routineExercise.routine_id, routineExercise.exercise_id, routineExercise.order_index]
          );
        }
      }

      // Insert restored workouts
      for (const workout of backupData.workouts) {
        await db.runAsync(
          'INSERT INTO workouts (id, date, name, duration_seconds, routine_id) VALUES (?, ?, ?, ?, ?)',
          [
            workout.id,
            workout.date,
            workout.name,
            workout.duration_seconds,
            workout.routine_id || null,
          ]
        );
      }

      // Insert restored sets
      for (const set of backupData.sets) {
        await db.runAsync(
          'INSERT INTO sets (id, workout_id, exercise_id, weight, reps, completed, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            set.id,
            set.workout_id,
            set.exercise_id,
            set.weight,
            set.reps,
            set.completed,
            set.timestamp || null,
          ]
        );
      }
    });

    // Step E: Return success
    return { success: true };
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  }
}

