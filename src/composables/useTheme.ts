import {
  ref,
  computed,
  watch,
  type ComputedRef,
  type Ref,
  type WritableComputedRef,
} from "vue";
import { Application, ApplicationSettings } from "@nativescript/core";

// iOS native types
declare const UIScreen: any;

// Types
export type BasicColorMode = "light" | "dark";
export type BasicColorSchema = BasicColorMode | "auto";

export interface UseColorModeOptions<T extends string = BasicColorMode> {
  /**
   * The initial color mode
   * @default 'auto'
   */
  initialValue?: T | BasicColorSchema;

  /**
   * Key to persist the data into ApplicationSettings
   * Pass `null` to disable persistence
   * @default 'vueuse-color-scheme'
   */
  storageKey?: string | null;

  /**
   * Emit `auto` mode from state
   * When set to `true`, preferred mode won't be translated into `light` or `dark`
   * @default false
   */
  emitAuto?: boolean;

  /**
   * Custom modes
   */
  modes?: Partial<Record<T | BasicColorSchema, string>>;

  /**
   * A custom handler for handle the updates
   */
  onChanged?: (
    mode: T | BasicColorMode,
    defaultHandler: (mode: T | BasicColorMode) => void
  ) => void;
}

export type UseColorModeReturn<T extends string = BasicColorMode> =
  WritableComputedRef<T | BasicColorSchema> & {
    /** The stored preference (can be 'auto') */
    store: Ref<T | BasicColorSchema>;
    /** System preference ('light' | 'dark') */
    system: ComputedRef<BasicColorMode>;
    /** Resolved state (never 'auto') */
    state: ComputedRef<T | BasicColorMode>;
  };

/**
 * Get current system appearance safely with native fallbacks
 */
function getSystemAppearance(): BasicColorMode {
  try {
    // 1. Try NativeScript Core API
    const appearance = Application.systemAppearance();
    if (appearance) return appearance;

    // 2. Fallback for iOS
    if (Application.ios && typeof UIScreen !== "undefined") {
      // UIUserInterfaceStyleDark = 2
      return UIScreen.mainScreen.traitCollection.userInterfaceStyle === 2
        ? "dark"
        : "light";
    }

    // 3. Fallback for Android
    if (Application.android && Application.android.context) {
      const uiMode = Application.android.context
        .getResources()
        .getConfiguration().uiMode;
      // UI_MODE_NIGHT_MASK = 48 (0x30), UI_MODE_NIGHT_YES = 32 (0x20)
      return (uiMode & 48) === 32 ? "dark" : "light";
    }
  } catch (e) {
    console.warn("Theme detection error:", e);
  }
  return "light";
}

/**
 * Reactive color mode with auto data persistence.
 * Based on VueUse's useColorMode pattern, adapted for NativeScript.
 *
 * @see https://vueuse.org/useColorMode
 */
export function useColorMode<T extends string = BasicColorMode>(
  options: UseColorModeOptions<T> = {}
) {
  const {
    initialValue = "auto" as T | BasicColorSchema,
    storageKey = "vueuse-color-scheme",
    emitAuto,
    onChanged,
  } = options;

  const modes = {
    auto: "",
    light: "light",
    dark: "dark",
    ...(options.modes || {}),
  } as Record<BasicColorSchema | T, string>;

  // System preference (reactive)
  const systemPreference = ref<BasicColorMode>(getSystemAppearance());

  // Computed system value
  const system = computed<BasicColorMode>(() => systemPreference.value);

  // Store (persisted value - can be 'auto')
  const store = ref<T | BasicColorSchema>(initialValue);

  // Load from storage
  if (storageKey != null) {
    try {
      const saved = ApplicationSettings.getString(storageKey);
      if (
        saved &&
        (saved === "auto" ||
          saved === "light" ||
          saved === "dark" ||
          saved in modes)
      ) {
        store.value = saved as T | BasicColorSchema;
      }
    } catch (e) {
      console.warn("useColorMode: Failed to load from storage", e);
    }
  }

  // State (resolved value - never 'auto')
  const state = computed<T | BasicColorMode>(() =>
    store.value === "auto" ? system.value : (store.value as T | BasicColorMode)
  );

  // Default handler (no-op for NativeScript - no DOM to update)
  function defaultOnChanged(_mode: T | BasicColorMode) {
    // In NativeScript, we don't manipulate HTML attributes
    // Components should react to the state/value changes via Vue reactivity
  }

  // Handle changes
  function handleChange(mode: T | BasicColorMode) {
    if (onChanged) {
      onChanged(mode, defaultOnChanged);
    } else {
      defaultOnChanged(mode);
    }
  }

  // Watch state changes
  watch(state, handleChange, { flush: "post", immediate: true });

  // Persist to storage when store changes
  watch(
    store,
    (newValue) => {
      if (storageKey != null) {
        try {
          ApplicationSettings.setString(storageKey, newValue);
        } catch (e) {
          console.warn("useColorMode: Failed to save to storage", e);
        }
      }
    },
    { flush: "post" }
  );

  // Listen for system appearance changes
  const onSystemChange = () => {
    systemPreference.value = getSystemAppearance();
  };

  Application.on(Application.systemAppearanceChangedEvent, onSystemChange);

  // The main reactive ref (getter/setter pattern like VueUse)
  const modeRef = computed<T | BasicColorSchema>({
    get() {
      return emitAuto ? store.value : state.value;
    },
    set(v) {
      store.value = v;
    },
  });

  // Return object matching VueUse's pattern
  return Object.assign(modeRef, {
    store,
    system,
    state,
  }) as UseColorModeReturn<T>;
}

/**
 * Reactive dark mode with auto data persistence.
 * Based on VueUse's useDark pattern, adapted for NativeScript.
 *
 * @see https://vueuse.org/useDark
 */
export function useDark(
  options: Omit<UseColorModeOptions<BasicColorMode>, "modes" | "onChanged"> & {
    onChanged?: (
      isDark: boolean,
      defaultHandler: (mode: BasicColorSchema) => void,
      mode: BasicColorSchema
    ) => void;
  } = {}
) {
  const mode = useColorMode({
    ...options,
    onChanged: options.onChanged
      ? (colorMode, defaultHandler) => {
          options.onChanged!(
            colorMode === "dark",
            defaultHandler,
            colorMode as BasicColorSchema
          );
        }
      : undefined,
  });

  const systemValue = computed(() => mode.system.value);

  const isDark = computed<boolean>({
    get() {
      return mode.state.value === "dark";
    },
    set(v) {
      const modeVal = v ? "dark" : "light";
      if (systemValue.value === modeVal) {
        mode.value = "auto";
      } else {
        mode.value = modeVal;
      }
    },
  });

  return isDark;
}
