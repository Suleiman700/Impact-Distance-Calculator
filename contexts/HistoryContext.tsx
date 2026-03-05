import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TargetResult, Session } from '../types';
import { loadHistory, saveHistory, clearHistory as storageClearHistory } from '../storage/history';
import { loadSessions, saveSessions, loadActiveSessionId, saveActiveSessionId } from '../storage/sessions';

interface HistoryContextType {
    history: TargetResult[];
    sessions: Session[];
    activeSession: Session | null;
    startSession: (name: string) => void;
    endSession: () => void;
    deleteSession: (id: string) => void;
    addResult: (result: TargetResult) => void;
    deleteResult: (timestamp: number) => void;
    clearHistory: () => void;
    isLoaded: boolean;
}

const HistoryContext = createContext<HistoryContextType>({
    history: [],
    sessions: [],
    activeSession: null,
    startSession: () => { },
    endSession: () => { },
    deleteSession: () => { },
    addResult: () => { },
    deleteResult: () => { },
    clearHistory: () => { },
    isLoaded: false,
});

export function HistoryProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<TargetResult[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        Promise.all([loadHistory(), loadSessions(), loadActiveSessionId()]).then(([hData, sData, activeId]) => {
            setHistory(hData);
            setSessions(sData);
            if (activeId) {
                const active = sData.find(s => s.id === activeId);
                setActiveSession(active || null);
            }
            setIsLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveHistory(history);
            saveSessions(sessions);
            saveActiveSessionId(activeSession?.id || null);
        }
    }, [history, sessions, activeSession, isLoaded]);

    const startSession = (name: string) => {
        const newSession: Session = {
            id: Date.now().toString(),
            name,
            createdAt: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSession(newSession);
    };

    const endSession = () => {
        if (activeSession) {
            setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, endedAt: Date.now() } : s));
            setActiveSession(null);
        }
    };

    const deleteSession = (id: string) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        setHistory(prev => prev.filter(h => h.sessionId !== id));
        if (activeSession?.id === id) {
            setActiveSession(null);
        }
    };

    const addResult = (result: TargetResult) => {
        const newResult = { ...result, sessionId: activeSession?.id };
        setHistory((prev) => [newResult, ...prev]);
    };

    const deleteResult = (timestamp: number) => {
        setHistory((prev) => prev.filter((item) => item.timestamp !== timestamp));
    };

    const clearHistory = async () => {
        setHistory([]);
        setSessions([]);
        setActiveSession(null);
        await storageClearHistory();
        await saveSessions([]);
        await saveActiveSessionId(null);
    };

    return (
        <HistoryContext.Provider value={{
            history,
            sessions,
            activeSession,
            startSession,
            endSession,
            deleteSession,
            addResult,
            deleteResult,
            clearHistory,
            isLoaded
        }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    return useContext(HistoryContext);
}
