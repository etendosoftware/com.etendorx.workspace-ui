"use client";

import React, { createContext, useContext, useState } from 'react';

type OpenWindow = {
    windowId: string;
    windowData: any;
};

type ContextType = {
    openWindows: OpenWindow[];
    addWindow: (windowId: string, data: any) => void;
    getWindowData: (windowId: string) => any;
};

const OpenWindowsContext = createContext<ContextType | undefined>(undefined);

export const OpenWindowsProvider = ({ children }: { children: React.ReactNode }) => {
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

    const addWindow = (windowId: string, data: any) => {
        setOpenWindows(prev => {
            if (prev.some(win => win.windowId === windowId)) return prev;
            return [...prev, { windowId, windowData: data }];
        });
    };

    const getWindowData = (windowId: string) =>
        openWindows.find(win => win.windowId === windowId)?.windowData;

    return (
        <OpenWindowsContext.Provider value={{ openWindows, addWindow, getWindowData }}>
            {children}
        </OpenWindowsContext.Provider>
    );
};

export const useOpenWindows = () => {
    const context = useContext(OpenWindowsContext);
    if (!context) {
        throw new Error('useOpenWindows must be used within OpenWindowsProvider');
    }
    return context;
};
