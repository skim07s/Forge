import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { appStorage } from "../utils/storage";
import { DEFAULT_THEME_ID, THEME_PRESETS, THEMES, getThemeById } from "../utils/themes";

const THEME_STORAGE_KEY = "forge-theme-id";

const useThemeStore = create(
  persist(
    (set, get) => ({
      themeId: DEFAULT_THEME_ID,
      setThemeId: (nextThemeId) => {
        if (!THEMES[nextThemeId] || get().themeId === nextThemeId) return;
        set({ themeId: nextThemeId });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({ themeId: state.themeId }),
    }
  )
);

export function ThemeProvider({ children }) {
  return <>{children}</>;
}

export function useTheme() {
  const { themeId, setThemeId } = useThemeStore(
    useShallow((state) => ({
      themeId: state.themeId,
      setThemeId: state.setThemeId,
    }))
  );
  const theme = React.useMemo(() => getThemeById(themeId), [themeId]);

  return {
    themeId,
    theme,
    setThemeId,
    themeOptions: THEME_PRESETS,
  };
}


