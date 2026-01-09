import { create } from 'zustand';
import { Platform } from 'react-native';

// Platform-aware storage (reused pattern)
let storage = null;
try {
  if (Platform.OS !== 'web') {
    const { MMKV } = require('react-native-mmkv');
    storage = new MMKV();
  }
} catch (error) {
  console.warn('MMKV initialization failed, falling back to localStorage');
}

const storageAdapter = {
  getString: (key) => {
    if (storage && Platform.OS !== 'web') return storage.getString(key);
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    return null;
  },
  set: (key, value) => {
    if (storage && Platform.OS !== 'web') storage.set(key, value);
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  delete: (key) => {
    if (storage && Platform.OS !== 'web') storage.delete(key);
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};

export const useIngotStore = create((set) => {
    const loadIngots = () => {
        try {
            const stored = storageAdapter.getString('ingots');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading ingots:', error);
            return [];
        }
    };

    const saveIngots = (ingots) => {
        try {
            storageAdapter.set('ingots', JSON.stringify(ingots));
        } catch (error) {
            console.error('Error saving ingots:', error);
        }
    };

    return {
        ingots: loadIngots(),

        addIngot: (title) => set((state) => {
            const newIngot = {
                id: Date.now().toString(),
                title: title.trim(),
                result: false, // false = pending, true = complete
                createdAt: new Date().toISOString(),
            };
            const updated = [newIngot, ...state.ingots];
            saveIngots(updated);
            return { ingots: updated };
        }),

        toggleIngot: (id) => set((state) => {
            const updated = state.ingots.map(item => 
                item.id === id ? { ...item, result: !item.result } : item
            );
            saveIngots(updated);
            return { ingots: updated };
        }),

        deleteIngot: (id) => set((state) => {
            const updated = state.ingots.filter(item => item.id !== id);
            saveIngots(updated);
            return { ingots: updated };
        }),
    };
});
