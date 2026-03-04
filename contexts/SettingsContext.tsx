import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Settings, loadSettings, saveSettings } from '../storage/settings';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (partial: Partial<Settings>) => void;
    isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: { unit: 'km', targetCount: 1 },
    updateSettings: () => { },
    isLoaded: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({ unit: 'km', targetCount: 1 });
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

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
