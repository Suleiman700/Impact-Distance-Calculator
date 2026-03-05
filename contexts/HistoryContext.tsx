import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TargetResult } from '../types';
import { loadHistory, saveHistory, clearHistory as storageClearHistory } from '../storage/history';

interface HistoryContextType {
    history: TargetResult[];
    addResult: (result: TargetResult) => void;
    deleteResult: (timestamp: number) => void;
    clearHistory: () => void;
    isLoaded: boolean;
}

const HistoryContext = createContext<HistoryContextType>({
    history: [],
    addResult: () => { },
    deleteResult: () => { },
    clearHistory: () => { },
    isLoaded: false,
});

export function HistoryProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<TargetResult[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadHistory().then((data) => {
            setHistory(data);
            setIsLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveHistory(history);
        }
    }, [history, isLoaded]);

    const addResult = (result: TargetResult) => {
        setHistory((prev) => [result, ...prev]);
    };

    const deleteResult = (timestamp: number) => {
        setHistory((prev) => prev.filter((item) => item.timestamp !== timestamp));
    };

    const clearHistory = async () => {
        setHistory([]);
        await storageClearHistory();
    };

    return (
        <HistoryContext.Provider value={{ history, addResult, deleteResult, clearHistory, isLoaded }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    return useContext(HistoryContext);
}
