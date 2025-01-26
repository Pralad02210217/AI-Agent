'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

// Define the types for the context
interface ModelContextType {
    currentModel: string; // You can use a string or enum to identify models
    setCurrentModel: (model: string) => void;
}

// Create the context with default values
export const ModelContext = createContext<ModelContextType>({
    currentModel: 'gemini-1.5-flash', // Default model
    setCurrentModel: () => {},
});

// Create a provider component
export function ModelProvider({ children }: { children: ReactNode }) {
    const [currentModel, setCurrentModel] = useState<string>('gemini-1.5-flash'); // Default to Gemini

    return (
        <ModelContext.Provider value={{ currentModel, setCurrentModel }}>
            {children}
        </ModelContext.Provider>
    );
}

// Custom hook to use the ModelContext
