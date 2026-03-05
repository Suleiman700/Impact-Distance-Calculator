import AsyncStorage from '@react-native-async-storage/async-storage';
import { TargetResult } from '../types';

const HISTORY_KEY = '@impact_distance_history';

export const saveHistory = async (history: TargetResult[]): Promise<void> => {
    try {
        const json = JSON.stringify(history);
        await AsyncStorage.setItem(HISTORY_KEY, json);
    } catch (e) {
        console.error('Failed to save history:', e);
    }
};

export const loadHistory = async (): Promise<TargetResult[]> => {
    try {
        const json = await AsyncStorage.getItem(HISTORY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load history:', e);
        return [];
    }
};

export const clearHistory = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (e) {
        console.error('Failed to clear history:', e);
    }
};
