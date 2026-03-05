import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types';

const SESSIONS_KEY = '@impact_distance_sessions';
const ACTIVE_SESSION_KEY = '@impact_distance_active_session';

export const loadSessions = async (): Promise<Session[]> => {
    try {
        const json = await AsyncStorage.getItem(SESSIONS_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load sessions:', e);
        return [];
    }
};

export const saveSessions = async (sessions: Session[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to save sessions:', e);
    }
};

export const loadActiveSessionId = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
    } catch {
        return null;
    }
};

export const saveActiveSessionId = async (id: string | null): Promise<void> => {
    try {
        if (id) {
            await AsyncStorage.setItem(ACTIVE_SESSION_KEY, id);
        } else {
            await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
        }
    } catch (e) {
        console.error('Failed to save active session:', e);
    }
};
