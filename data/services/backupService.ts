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

