import AsyncStorage from '@react-native-async-storage/async-storage';

export type Routine = {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
};

const ROUTINES_STORAGE_KEY = 'user_routines';

// Get all user routines
export const getUserRoutines = async (): Promise<Routine[]> => {
  try {
    const routinesJson = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
    if (routinesJson) {
      return JSON.parse(routinesJson);
    }
    return [];
  } catch (error) {
    console.error('Error fetching user routines:', error);
    return [];
  }
};

// Create a new routine
export const createRoutine = async (name: string, exerciseIds: string[]): Promise<Routine> => {
  try {
    const routines = await getUserRoutines();
    const newRoutine: Routine = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      exerciseIds,
      createdAt: new Date().toISOString(),
    };

    routines.push(newRoutine);
    await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
    return newRoutine;
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
};

// Delete a routine
export const deleteRoutine = async (routineId: string): Promise<void> => {
  try {
    const routines = await getUserRoutines();
    const filteredRoutines = routines.filter((r) => r.id !== routineId);
    await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(filteredRoutines));
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
};

