import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@impact_distance_settings';

export interface Settings {
    unit: 'km' | 'mile';
    theme: 'light' | 'dark';
    showLiveStats: boolean;
    showOnboarding: boolean;
    locationMode: 'gps' | 'manual';
    manualLocation: { latitude: number; longitude: number } | null;
    targetCount: number;
    directionMode: 'off' | 'sensor';
    tiltEnabled: boolean; // 3D tilt tracking
    buttonPosition: 'top' | 'bottom';
}

const DEFAULT_SETTINGS: Settings = {
    unit: 'km',
    targetCount: 1,
    theme: 'light',
    showLiveStats: true,
    showOnboarding: true,
    locationMode: 'gps',
    manualLocation: null,
    directionMode: 'off',
    tiltEnabled: false,
    buttonPosition: 'bottom',
};

export async function loadSettings(): Promise<Settings> {
    try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
    } catch {
        // Fall through to defaults
    }
    return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
    try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        console.warn('Failed to save settings');
    }
}
