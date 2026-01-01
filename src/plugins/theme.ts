import { App, reactive, watch, computed } from "vue";
import {
  Application,
  ApplicationSettings,
  Page,
  View,
} from "@nativescript/core";

const STORAGE_KEY = "user_theme_preference";
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// --- Global Reactive State ---
const themeState = reactive({
  preference: "system" as ThemeMode,
  current: "light" as ResolvedTheme,
});

// --- Helpers ---

const getSystemTheme = (): ResolvedTheme => {
  try {
    return Application.systemAppearance() === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const updateResolvedTheme = () => {
  if (themeState.preference === "system") {
    themeState.current = getSystemTheme();
  } else {
    themeState.current = themeState.preference === "dark" ? "dark" : "light";
  }
};

// --- Initialization & Watchers ---

const initTheme = () => {
  try {
    const saved = ApplicationSettings.getString(STORAGE_KEY);
    if (saved && ["light", "dark", "system"].includes(saved)) {
      themeState.preference = saved as ThemeMode;
    }
  } catch (e) {
    console.error("Theme init error:", e);
  }
  updateResolvedTheme();
};

// Watch user preference changes
watch(
  () => themeState.preference,
  (newVal) => {
    ApplicationSettings.setString(STORAGE_KEY, newVal);
    updateResolvedTheme();
  }
);

// Watch system appearance changes
const onSystemChange = () => {
  if (themeState.preference === "system") {
    updateResolvedTheme();
  }
};

// Setup system listeners
Application.off(Application.systemAppearanceChangedEvent, onSystemChange); // Ensure no duplicates
Application.on(Application.systemAppearanceChangedEvent, onSystemChange);

// Run init
initTheme();

// --- Plugin Definition ---

export const ThemePlugin = {
  install(app: App) {
    // 1. Provide global properties (Optional, for Options API)
    app.config.globalProperties.$theme = {
      setMode: (mode: ThemeMode) => {
        themeState.preference = mode;
      },
      get mode() {
        return themeState.preference;
      },
      get current() {
        return themeState.current;
      },
    };

    // 2. Provide for Composition API (via inject)
    app.provide("theme", {
      setMode: (mode: ThemeMode) => {
        themeState.preference = mode;
      },
      mode: computed(() => themeState.preference),
      current: computed(() => themeState.current),
    });

    // 3. Global Mixin to inject Page behavior
    app.mixin({
      mounted() {
        const view = this.$el as View;
        // Check if the root element of the component is a Page
        if (view && view.typeName === "Page") {
          const page = view as Page;

          const applyPageTheme = () => {
            const isDark = themeState.current === "dark";

            // Apply CSS Classes
            const p = page as any;
            if (isDark) {
              if (p.addCssClass) p.addCssClass("dark");
              if (p.removeCssClass) p.removeCssClass("light");
            } else {
              if (p.addCssClass) p.addCssClass("light");
              if (p.removeCssClass) p.removeCssClass("dark");
            }

            // Apply Status Bar Style (Inverted)
            // Dark Theme -> Light Text (light)
            // Light Theme -> Dark Text (dark)
            page.statusBarStyle = isDark ? "light" : "dark";
          };

          // Apply immediately
          applyPageTheme();

          // Watch for changes
          const unwatch = watch(() => themeState.current, applyPageTheme);

          // Store unwatch to clean up later
          (this as any)._themeUnwatch = unwatch;
        }
      },
      unmounted() {
        if ((this as any)._themeUnwatch) {
          (this as any)._themeUnwatch();
        }
      },
    });
  },
};

// --- Composable ---

export function useTheme() {
  return {
    setTheme: (mode: ThemeMode) => {
      themeState.preference = mode;
    },
    userPreference: computed(() => themeState.preference),
    currentTheme: computed(() => themeState.current),
    isDark: computed(() => themeState.current === "dark"),
  };
}
