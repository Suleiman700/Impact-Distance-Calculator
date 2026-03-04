import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Settings, loadSettings, saveSettings } from '../storage/settings';
import { ThemeColors, lightColors, darkColors } from '../theme';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (partial: Partial<Settings>) => void;
    isLoaded: boolean;
    colors: ThemeColors;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: { unit: 'km', targetCount: 1, theme: 'light', showLiveStats: true },
    updateSettings: () => { },
    isLoaded: false,
    colors: lightColors,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({ unit: 'km', targetCount: 1, theme: 'light', showLiveStats: true });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadSettings().then((s) => {
            setSettings(s);
            setIsLoaded(true);
        });
    }, []);

    const updateSettings = (partial: Partial<Settings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...partial };
            saveSettings(next);
            return next;
        });
    };

    const colors = settings.theme === 'dark' ? darkColors : lightColors;

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoaded, colors }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
