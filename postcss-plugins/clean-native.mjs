/**
 * PostCSS Plugin: clean-native
 *
 * يقوم بتنظيف CSS الناتج من Tailwind ليكون متوافقاً مع NativeScript
 * يحذف الـ Selectors غير المدعومة ويعالج القيم والخصائص
 *
 * @module clean-native
 * @version 2.1.0 (ESM)
 */

// ============================================
// Constants & Configuration
// ============================================

const REM_REGEX = /\d?\.?\d+\s*r?em/g;

/**
 * Tailwind CSS v4 Default Colors - Pre-computed HEX values
 * Converted from oklch to hex for NativeScript compatibility
 */
const TAILWIND_V4_COLORS = {
  // Red
  "--color-red-50": "#fef2f2",
  "--color-red-100": "#fee2e2",
  "--color-red-200": "#fecaca",
  "--color-red-300": "#fca5a5",
  "--color-red-400": "#f87171",
  "--color-red-500": "#ef4444",
  "--color-red-600": "#dc2626",
  "--color-red-700": "#b91c1c",
  "--color-red-800": "#991b1b",
  "--color-red-900": "#7f1d1d",
  "--color-red-950": "#450a0a",
  // Orange
  "--color-orange-50": "#fff7ed",
  "--color-orange-100": "#ffedd5",
  "--color-orange-200": "#fed7aa",
  "--color-orange-300": "#fdba74",
  "--color-orange-400": "#fb923c",
  "--color-orange-500": "#f97316",
  "--color-orange-600": "#ea580c",
  "--color-orange-700": "#c2410c",
  "--color-orange-800": "#9a3412",
  "--color-orange-900": "#7c2d12",
  "--color-orange-950": "#431407",
  // Amber
  "--color-amber-50": "#fffbeb",
  "--color-amber-100": "#fef3c7",
  "--color-amber-200": "#fde68a",
  "--color-amber-300": "#fcd34d",
  "--color-amber-400": "#fbbf24",
  "--color-amber-500": "#f59e0b",
  "--color-amber-600": "#d97706",
  "--color-amber-700": "#b45309",
  "--color-amber-800": "#92400e",
  "--color-amber-900": "#78350f",
  "--color-amber-950": "#451a03",
  // Yellow
  "--color-yellow-50": "#fefce8",
  "--color-yellow-100": "#fef9c3",
  "--color-yellow-200": "#fef08a",
  "--color-yellow-300": "#fde047",
  "--color-yellow-400": "#facc15",
  "--color-yellow-500": "#eab308",
  "--color-yellow-600": "#ca8a04",
  "--color-yellow-700": "#a16207",
  "--color-yellow-800": "#854d0e",
  "--color-yellow-900": "#713f12",
  "--color-yellow-950": "#422006",
  // Lime
  "--color-lime-50": "#f7fee7",
  "--color-lime-100": "#ecfccb",
  "--color-lime-200": "#d9f99d",
  "--color-lime-300": "#bef264",
  "--color-lime-400": "#a3e635",
  "--color-lime-500": "#84cc16",
  "--color-lime-600": "#65a30d",
  "--color-lime-700": "#4d7c0f",
  "--color-lime-800": "#3f6212",
  "--color-lime-900": "#365314",
  "--color-lime-950": "#1a2e05",
  // Green
  "--color-green-50": "#f0fdf4",
  "--color-green-100": "#dcfce7",
  "--color-green-200": "#bbf7d0",
  "--color-green-300": "#86efac",
  "--color-green-400": "#4ade80",
  "--color-green-500": "#22c55e",
  "--color-green-600": "#16a34a",
  "--color-green-700": "#15803d",
  "--color-green-800": "#166534",
  "--color-green-900": "#14532d",
  "--color-green-950": "#052e16",
  // Emerald
  "--color-emerald-50": "#ecfdf5",
  "--color-emerald-100": "#d1fae5",
  "--color-emerald-200": "#a7f3d0",
  "--color-emerald-300": "#6ee7b7",
  "--color-emerald-400": "#34d399",
  "--color-emerald-500": "#10b981",
  "--color-emerald-600": "#059669",
  "--color-emerald-700": "#047857",
  "--color-emerald-800": "#065f46",
  "--color-emerald-900": "#064e3b",
  "--color-emerald-950": "#022c22",
  // Teal
  "--color-teal-50": "#f0fdfa",
  "--color-teal-100": "#ccfbf1",
  "--color-teal-200": "#99f6e4",
  "--color-teal-300": "#5eead4",
  "--color-teal-400": "#2dd4bf",
  "--color-teal-500": "#14b8a6",
  "--color-teal-600": "#0d9488",
  "--color-teal-700": "#0f766e",
  "--color-teal-800": "#115e59",
  "--color-teal-900": "#134e4a",
  "--color-teal-950": "#042f2e",
  // Cyan
  "--color-cyan-50": "#ecfeff",
  "--color-cyan-100": "#cffafe",
  "--color-cyan-200": "#a5f3fc",
  "--color-cyan-300": "#67e8f9",
  "--color-cyan-400": "#22d3ee",
  "--color-cyan-500": "#06b6d4",
  "--color-cyan-600": "#0891b2",
  "--color-cyan-700": "#0e7490",
  "--color-cyan-800": "#155e75",
  "--color-cyan-900": "#164e63",
  "--color-cyan-950": "#083344",
  // Sky
  "--color-sky-50": "#f0f9ff",
  "--color-sky-100": "#e0f2fe",
  "--color-sky-200": "#bae6fd",
  "--color-sky-300": "#7dd3fc",
  "--color-sky-400": "#38bdf8",
  "--color-sky-500": "#0ea5e9",
  "--color-sky-600": "#0284c7",
  "--color-sky-700": "#0369a1",
  "--color-sky-800": "#075985",
  "--color-sky-900": "#0c4a6e",
  "--color-sky-950": "#082f49",
  // Blue
  "--color-blue-50": "#eff6ff",
  "--color-blue-100": "#dbeafe",
  "--color-blue-200": "#bfdbfe",
  "--color-blue-300": "#93c5fd",
  "--color-blue-400": "#60a5fa",
  "--color-blue-500": "#3b82f6",
  "--color-blue-600": "#2563eb",
  "--color-blue-700": "#1d4ed8",
  "--color-blue-800": "#1e40af",
  "--color-blue-900": "#1e3a8a",
  "--color-blue-950": "#172554",
  // Indigo
  "--color-indigo-50": "#eef2ff",
  "--color-indigo-100": "#e0e7ff",
  "--color-indigo-200": "#c7d2fe",
  "--color-indigo-300": "#a5b4fc",
  "--color-indigo-400": "#818cf8",
  "--color-indigo-500": "#6366f1",
  "--color-indigo-600": "#4f46e5",
  "--color-indigo-700": "#4338ca",
  "--color-indigo-800": "#3730a3",
  "--color-indigo-900": "#312e81",
  "--color-indigo-950": "#1e1b4b",
  // Violet
  "--color-violet-50": "#f5f3ff",
  "--color-violet-100": "#ede9fe",
  "--color-violet-200": "#ddd6fe",
  "--color-violet-300": "#c4b5fd",
  "--color-violet-400": "#a78bfa",
  "--color-violet-500": "#8b5cf6",
  "--color-violet-600": "#7c3aed",
  "--color-violet-700": "#6d28d9",
  "--color-violet-800": "#5b21b6",
  "--color-violet-900": "#4c1d95",
  "--color-violet-950": "#2e1065",
  // Purple
  "--color-purple-50": "#faf5ff",
  "--color-purple-100": "#f3e8ff",
  "--color-purple-200": "#e9d5ff",
  "--color-purple-300": "#d8b4fe",
  "--color-purple-400": "#c084fc",
  "--color-purple-500": "#a855f7",
  "--color-purple-600": "#9333ea",
  "--color-purple-700": "#7e22ce",
  "--color-purple-800": "#6b21a8",
  "--color-purple-900": "#581c87",
  "--color-purple-950": "#3b0764",
  // Fuchsia
  "--color-fuchsia-50": "#fdf4ff",
  "--color-fuchsia-100": "#fae8ff",
  "--color-fuchsia-200": "#f5d0fe",
  "--color-fuchsia-300": "#f0abfc",
  "--color-fuchsia-400": "#e879f9",
  "--color-fuchsia-500": "#d946ef",
  "--color-fuchsia-600": "#c026d3",
  "--color-fuchsia-700": "#a21caf",
  "--color-fuchsia-800": "#86198f",
  "--color-fuchsia-900": "#701a75",
  "--color-fuchsia-950": "#4a044e",
  // Pink
  "--color-pink-50": "#fdf2f8",
  "--color-pink-100": "#fce7f3",
  "--color-pink-200": "#fbcfe8",
  "--color-pink-300": "#f9a8d4",
  "--color-pink-400": "#f472b6",
  "--color-pink-500": "#ec4899",
  "--color-pink-600": "#db2777",
  "--color-pink-700": "#be185d",
  "--color-pink-800": "#9d174d",
  "--color-pink-900": "#831843",
  "--color-pink-950": "#500724",
  // Rose
  "--color-rose-50": "#fff1f2",
  "--color-rose-100": "#ffe4e6",
  "--color-rose-200": "#fecdd3",
  "--color-rose-300": "#fda4af",
  "--color-rose-400": "#fb7185",
  "--color-rose-500": "#f43f5e",
  "--color-rose-600": "#e11d48",
  "--color-rose-700": "#be123c",
  "--color-rose-800": "#9f1239",
  "--color-rose-900": "#881337",
  "--color-rose-950": "#4c0519",
  // Slate
  "--color-slate-50": "#f8fafc",
  "--color-slate-100": "#f1f5f9",
  "--color-slate-200": "#e2e8f0",
  "--color-slate-300": "#cbd5e1",
  "--color-slate-400": "#94a3b8",
  "--color-slate-500": "#64748b",
  "--color-slate-600": "#475569",
  "--color-slate-700": "#334155",
  "--color-slate-800": "#1e293b",
  "--color-slate-900": "#0f172a",
  "--color-slate-950": "#020617",
  // Gray
  "--color-gray-50": "#f9fafb",
  "--color-gray-100": "#f3f4f6",
  "--color-gray-200": "#e5e7eb",
  "--color-gray-300": "#d1d5db",
  "--color-gray-400": "#9ca3af",
  "--color-gray-500": "#6b7280",
  "--color-gray-600": "#4b5563",
  "--color-gray-700": "#374151",
  "--color-gray-800": "#1f2937",
  "--color-gray-900": "#111827",
  "--color-gray-950": "#030712",
  // Zinc
  "--color-zinc-50": "#fafafa",
  "--color-zinc-100": "#f4f4f5",
  "--color-zinc-200": "#e4e4e7",
  "--color-zinc-300": "#d4d4d8",
  "--color-zinc-400": "#a1a1aa",
  "--color-zinc-500": "#71717a",
  "--color-zinc-600": "#52525b",
  "--color-zinc-700": "#3f3f46",
  "--color-zinc-800": "#27272a",
  "--color-zinc-900": "#18181b",
  "--color-zinc-950": "#09090b",
  // Neutral
  "--color-neutral-50": "#fafafa",
  "--color-neutral-100": "#f5f5f5",
  "--color-neutral-200": "#e5e5e5",
  "--color-neutral-300": "#d4d4d4",
  "--color-neutral-400": "#a3a3a3",
  "--color-neutral-500": "#737373",
  "--color-neutral-600": "#525252",
  "--color-neutral-700": "#404040",
  "--color-neutral-800": "#262626",
  "--color-neutral-900": "#171717",
  "--color-neutral-950": "#0a0a0a",
  // Stone
  "--color-stone-50": "#fafaf9",
  "--color-stone-100": "#f5f5f4",
  "--color-stone-200": "#e7e5e4",
  "--color-stone-300": "#d6d3d1",
  "--color-stone-400": "#a8a29e",
  "--color-stone-500": "#78716c",
  "--color-stone-600": "#57534e",
  "--color-stone-700": "#44403c",
  "--color-stone-800": "#292524",
  "--color-stone-900": "#1c1917",
  "--color-stone-950": "#0c0a09",
  // Base colors
  "--color-black": "#000000",
  "--color-white": "#ffffff",
};

/**
 * تحويل oklch إلى hex
 * NativeScript لا يدعم oklch، فقط hex
 */
const OKLCH_REGEX = /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)/gi;

/**
 * تحويل oklch color إلى hex
 * @param {number} l - Lightness (0-1 or 0%-100%)
 * @param {number} c - Chroma (0-0.4 typically)
 * @param {number} h - Hue (0-360)
 * @returns {string} hex color
 */
function oklchToHex(l, c, h) {
  // Normalize lightness to 0-1
  if (l > 1) l = l / 100;

  // Convert oklch to oklab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // Convert oklab to linear sRGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // Gamma correction (linear to sRGB)
  const toSrgb = (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  r = Math.round(toSrgb(r) * 255);
  g = Math.round(toSrgb(g) * 255);
  bl = Math.round(toSrgb(bl) * 255);

  // Clamp to valid range
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  bl = Math.max(0, Math.min(255, bl));

  // Convert to hex
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/**
 * تحويل جميع قيم oklch في النص إلى hex
 * @param {string} value
 * @returns {string}
 */
function convertOklchToHex(value) {
  return value.replace(OKLCH_REGEX, (match, l, c, h) => {
    const lightness = parseFloat(l);
    const chroma = parseFloat(c);
    const hue = parseFloat(h);
    return oklchToHex(lightness, chroma, hue);
  });
}

/**
 * Get pre-computed hex color for Tailwind CSS variable
 * @param {string} varName - CSS variable name (e.g., "--color-red-500")
 * @returns {string|null} hex color or null if not found
 */
function getTailwindHexColor(varName) {
  return TAILWIND_V4_COLORS[varName] || null;
}

/**
 * الخصائص المدعومة في NativeScript CSS Engine
 * القيمة `true` تعني دعم كامل، المصفوفة تحدد القيم المسموحة فقط
 */
const SUPPORTED_PROPERTIES = {
  // Alignment & Layout
  "align-content": true,
  "align-items": true,
  "align-self": true,
  "justify-content": true,
  "justify-items": true,
  "justify-self": true,
  "place-content": true,
  "place-items": true,
  "place-self": true,
  order: true,

  // Flexbox
  flex: true,
  "flex-grow": true,
  "flex-direction": true,
  "flex-shrink": true,
  "flex-wrap": true,

  // Gap (Flexbox/Grid spacing)
  gap: true,
  "row-gap": true,
  "column-gap": true,

  // Dimensions
  width: true,
  height: true,
  "min-width": true,
  "min-height": true,
  "max-width": true,
  "max-height": true,

  // Spacing
  margin: true,
  "margin-top": true,
  "margin-right": true,
  "margin-bottom": true,
  "margin-left": true,
  "margin-block": true,
  "margin-block-start": true,
  "margin-block-end": true,
  "margin-inline": true,
  "margin-inline-start": true,
  "margin-inline-end": true,
  padding: true,
  "padding-top": true,
  "padding-right": true,
  "padding-bottom": true,
  "padding-left": true,
  "padding-block": true,
  "padding-inline": true,

  // Border
  "border-width": true,
  "border-top-width": true,
  "border-right-width": true,
  "border-bottom-width": true,
  "border-left-width": true,
  "border-color": true,
  "border-top-color": true,
  "border-right-color": true,
  "border-bottom-color": true,
  "border-left-color": true,
  "border-radius": true,
  "border-top-left-radius": true,
  "border-top-right-radius": true,
  "border-bottom-right-radius": true,
  "border-bottom-left-radius": true,

  // Background
  background: true,
  "background-color": true,
  "background-image": true,
  "background-position": true,
  "background-repeat": ["repeat", "repeat-x", "repeat-y", "no-repeat"],
  "background-size": true,

  // Typography
  color: true,
  font: true,
  "font-family": true,
  "font-size": true,
  "font-style": ["italic", "normal"],
  "font-weight": true,
  "font-variation-settings": true,
  "letter-spacing": true,
  "line-height": true,
  "text-align": ["left", "center", "right"],
  "text-decoration": ["none", "line-through", "underline"],
  "text-shadow": true,
  "text-transform": ["none", "capitalize", "uppercase", "lowercase"],

  // Visual Effects
  opacity: true,
  visibility: ["visible", "collapse"],
  "box-shadow": true,
  "clip-path": true,
  transform: true,
  rotate: true,
  "z-index": true,

  // Animation
  animation: true,
  "animation-delay": true,
  "animation-direction": true,
  "animation-duration": true,
  "animation-fill-mode": true,
  "animation-iteration-count": true,
  "animation-name": true,
  "animation-timing-function": true,

  // NativeScript Specific
  "placeholder-color": true,
  "highlight-color": true,
  "horizontal-align": ["left", "center", "right", "stretch"],
  "vertical-align": ["top", "center", "bottom", "stretch"],
  "android-selected-tab-highlight-color": true,
  "android-elevation": true,
  "android-dynamic-elevation-offset": true,
  "off-background-color": true,
  "selected-tab-text-color": true,
  "tab-background-color": true,
  "tab-text-color": true,
  "tab-text-font-size": true,
};

/**
 * Pseudo selectors غير مدعومة في NativeScript
 */
const UNSUPPORTED_PSEUDO_SELECTORS = [
  ":focus-within",
  ":hover",
  ":focus-visible",
  ":active",
  "::before",
  "::after",
  "::first-line",
  "::first-letter",
  "::selection",
  "::marker",
  "::backdrop",
];

/**
 * قيم CSS غير مدعومة
 */
const UNSUPPORTED_VALUES = [
  "max-content",
  "min-content",
  "fit-content",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "dvh",
  "dvw",
  "svh",
  "svw",
  "lvh",
  "lvw",
];

/**
 * CSS Variables patterns غير مدعومة
 */
const UNSUPPORTED_VAR_PATTERNS = [
  "tw-ring",
  "tw-shadow",
  "tw-ordinal",
  "tw-slashed-zero",
  "tw-numeric",
  "tw-backdrop",
  "tw-blur",
  "tw-grayscale",
  "tw-invert",
  "tw-sepia",
  "tw-saturate",
  "tw-hue-rotate",
  "tw-drop-shadow",
];

// ============================================
// Helper Functions
// ============================================

/**
 * يتحقق مما إذا كانت الخاصية مدعومة
 * @param {string} prop - اسم الخاصية
 * @param {string|null} value - قيمة الخاصية (اختياري)
 * @returns {boolean}
 */
function isSupportedProperty(prop, value = null) {
  const rules = SUPPORTED_PROPERTIES[prop];
  if (!rules) return false;

  if (value) {
    // تحقق من القيم غير المدعومة
    if (UNSUPPORTED_VALUES.some((unit) => value.includes(unit))) {
      return false;
    }
    // تحقق من القيم المحددة إذا كانت Rules مصفوفة
    if (Array.isArray(rules)) {
      return rules.includes(value);
    }
  }

  return true;
}

/**
 * يتحقق مما إذا كان الـ Selector مدعوماً
 * @param {string} selector
 * @returns {boolean}
 */
function isSupportedSelector(selector) {
  return !UNSUPPORTED_PSEUDO_SELECTORS.some((pseudo) =>
    selector.includes(pseudo)
  );
}

/**
 * يتحقق مما إذا كان الـ Selector يحتوي على ::placeholder
 * @param {string} selector
 * @returns {boolean}
 */
function isPlaceholderSelector(selector) {
  return selector.includes("::placeholder");
}

/**
 * يحول قيم rem/em إلى قيم رقمية (16px = 1rem)
 * @param {string} value
 * @returns {string}
 */
function convertRemToPixels(value) {
  return value.replace(REM_REGEX, (match) => {
    return String(parseFloat(match) * 16);
  });
}

// ============================================
// Main Plugin
// ============================================

/**
 * PostCSS Plugin لتنظيف CSS لـ NativeScript
 * @param {Object} options - خيارات البلجن
 * @param {boolean} options.debug - تفعيل وضع التصحيح
 * @returns {import('postcss').Plugin}
 */
const cleanNativePlugin = (options = { debug: false }) => {
  const { debug } = options;

  const log = (...args) => {
    if (debug) console.log("[clean-native]", ...args);
  };

  return {
    postcssPlugin: "postcss-clean-native",

    // ========================================
    // معالجة At-Rules
    // ========================================
    AtRule: {
      /**
       * معالجة @media rules
       * - تحويل prefers-color-scheme: dark إلى .ns-dark class selector
       * - حذف باقي الـ @media rules
       */
      media(atRule) {
        // تحويل dark mode media query إلى class-based
        if (atRule.params.includes("prefers-color-scheme: dark")) {
          log("Converting dark mode @media to class-based");

          const parentRule = atRule.parent;
          if (parentRule && parentRule.type === "rule") {
            atRule.walkDecls((decl) => {
              parentRule.append(decl.clone());
            });

            // تحويل selector من .dark\:bg-black إلى .ns-dark .bg-black
            parentRule.selectors = parentRule.selectors.map((selector) => {
              const cleanSelector = selector.replace(/\.dark\\:/g, ".");
              return `.ns-dark ${cleanSelector}`;
            });

            log("New selector:", parentRule.selector);
          }

          atRule.remove();
          return;
        }

        // حذف باقي الـ @media rules
        log("Removing @media:", atRule.params);
        atRule.remove();
      },

      /**
       * إزالة @supports rules - غير مدعومة
       * Tailwind v4 يستخدمها للتوافق مع المتصفحات
       */
      supports(atRule) {
        log("Removing @supports:", atRule.params);
        atRule.remove();
      },

      /**
       * إزالة @property rules
       * Tailwind v4 يستخدمها لتعريف CSS Custom Properties
       */
      property(atRule) {
        log("Removing @property:", atRule.params);
        atRule.remove();
      },

      /**
       * إزالة @font-face - يتم التعامل مع الخطوط بشكل مختلف في NativeScript
       */
      "font-face"(atRule) {
        log("Removing @font-face");
        atRule.remove();
      },

      /**
       * فك @layer blocks - NativeScript لا يدعم CSS Cascade Layers
       * نرفع المحتوى للمستوى الأعلى مع الحفاظ على الترتيب
       */
      layer(atRule) {
        if (!atRule.nodes || !atRule.nodes.length) {
          return atRule.remove();
        }
        log("Unwrapping @layer:", atRule.params);
        atRule.replaceWith(...atRule.nodes);
      },
    },

    // ========================================
    // معالجة Rules (Selectors)
    // ========================================
    Rule(rule) {
      // ========================================
      // معالجة Tailwind v4 Custom Variant (dark mode)
      // البنية: .dark\:bg-black { &:where(.ns-dark, .ns-dark *) { ... } }
      // ========================================
      if (rule.selector && rule.selector.includes("dark\\:")) {
        // Check if this rule has nested &:where(.ns-dark...) rules
        let hasNestedDarkVariant = false;

        rule.walkRules((nestedRule) => {
          // Match &:where(.ns-dark, .ns-dark *)
          if (
            nestedRule.selector &&
            nestedRule.selector.includes(":where(") &&
            nestedRule.selector.includes("ns-dark")
          ) {
            hasNestedDarkVariant = true;

            // Get the parent selector (e.g., .dark\:bg-black)
            const parentSelector = rule.selector;
            // Extract the class name without dark: prefix
            // .dark\:bg-black -> .bg-black
            const cleanClass = parentSelector.replace(/\.dark\\:/g, ".");

            // Create new selector: .ns-dark .bg-black
            const newSelector = `.ns-dark ${cleanClass}`;

            log("Converting dark variant:", parentSelector, "->", newSelector);

            // Move declarations from nested rule to parent
            nestedRule.walkDecls((decl) => {
              rule.append(decl.clone());
            });

            // Update parent selector
            rule.selector = newSelector;

            // Remove the nested rule
            nestedRule.remove();
          }
        });

        // If no nested rules found but still has dark: in selector,
        // it might be a direct dark variant (keep it but convert selector)
        if (!hasNestedDarkVariant && rule.nodes && rule.nodes.length > 0) {
          // Check if all children are declarations (not nested rules)
          const hasOnlyDecls = rule.nodes.every((node) => node.type === "decl");
          if (hasOnlyDecls) {
            const cleanClass = rule.selector.replace(/\.dark\\:/g, ".");
            rule.selector = `.ns-dark ${cleanClass}`;
            log("Converted direct dark selector:", rule.selector);
          }
        }
      }

      // إزالة القواعد الفارغة
      if (!rule.selector || rule.selector.trim() === "") {
        return rule.remove();
      }

      if (!rule.nodes || rule.nodes.length === 0) {
        return rule.remove();
      }

      // قائمة شاملة بـ HTML tags غير المدعومة في NativeScript
      const unsupportedHtmlTags = [
        "html",
        "body",
        "head",
        "meta",
        "link",
        "script",
        "style",
        "title",
        "div",
        "span",
        "p",
        "a",
        "ul",
        "ol",
        "li",
        "dl",
        "dt",
        "dd",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "br",
        "table",
        "thead",
        "tbody",
        "tfoot",
        "tr",
        "th",
        "td",
        "caption",
        "colgroup",
        "col",
        "form",
        "input",
        "button",
        "select",
        "option",
        "optgroup",
        "textarea",
        "fieldset",
        "legend",
        "img",
        "picture",
        "source",
        "figure",
        "figcaption",
        "video",
        "audio",
        "track",
        "canvas",
        "iframe",
        "embed",
        "object",
        "param",
        "map",
        "area",
        "article",
        "aside",
        "nav",
        "header",
        "footer",
        "main",
        "section",
        "details",
        "summary",
        "dialog",
        "menu",
        "menuitem",
        "abbr",
        "address",
        "b",
        "bdi",
        "bdo",
        "blockquote",
        "cite",
        "code",
        "data",
        "dfn",
        "em",
        "i",
        "kbd",
        "mark",
        "q",
        "rp",
        "rt",
        "ruby",
        "s",
        "samp",
        "small",
        "strong",
        "sub",
        "sup",
        "time",
        "u",
        "var",
        "wbr",
        "del",
        "ins",
        "pre",
        "noscript",
        "template",
        "slot",
        "svg",
      ];

      // إنشاء regex للتحقق من HTML tags (في أي موضع بالـ selector)
      const htmlTagsPattern = new RegExp(
        `(^|\\s|,|>|\\+|~)(${unsupportedHtmlTags.join("|")})(\\s|,|:|\\[|>|\\+|~|$)`,
        "i"
      );

      // تصفية الـ selectors وإزالة HTML tags
      const filteredSelectors = rule.selectors.filter((selector) => {
        const trimmedSelector = selector.trim();

        // إزالة * selector
        if (trimmedSelector === "*") {
          log("Removing universal selector");
          return false;
        }

        // إزالة selectors تحتوي على HTML tags
        if (htmlTagsPattern.test(trimmedSelector)) {
          log("Removing HTML tag selector:", trimmedSelector);
          return false;
        }

        // إزالة selectors تحتوي على :is() أو :has() مع HTML tags
        if (/:is\(|:has\(|:where\(/.test(trimmedSelector)) {
          const innerContent = trimmedSelector.match(
            /:(?:is|has|where)\(([^)]+)\)/
          );
          if (
            innerContent &&
            unsupportedHtmlTags.some((tag) =>
              new RegExp(`(^|,|\\s)${tag}(,|\\s|\\[|:|$)`, "i").test(
                innerContent[1]
              )
            )
          ) {
            log(
              "Removing selector with HTML tags inside :is/:has/:where:",
              trimmedSelector
            );
            return false;
          }
        }

        // إزالة selectors تبدأ بـ :: (pseudo elements غير placeholder)
        if (/^::(?!placeholder)/.test(trimmedSelector)) {
          log("Removing pseudo element selector:", trimmedSelector);
          return false;
        }

        // إزالة selectors تبدأ بـ :- (vendor prefixed)
        if (/^:-|^::-/.test(trimmedSelector)) {
          log("Removing vendor prefixed selector:", trimmedSelector);
          return false;
        }

        return true;
      });

      // إذا لم يتبق أي selectors، احذف القاعدة
      if (filteredSelectors.length === 0) {
        return rule.remove();
      }

      // تحديث الـ selectors
      rule.selectors = filteredSelectors;

      // إزالة CSS nesting (& selector) - غير مدعوم في NativeScript
      if (rule.selector.includes("&")) {
        log("Removing nested selector:", rule.selector);
        return rule.remove();
      }

      // تحويل :root و :host إلى .ns-root, .ns-modal
      if (rule.selector.includes(":root") || rule.selector.includes(":host")) {
        const nsRootClasses = ".ns-root, .ns-modal";
        rule.selectors = rule.selectors.map((selector) =>
          selector
            .replace(/:root/g, nsRootClasses)
            .replace(/:host/g, nsRootClasses)
        );
        log("Converted :root/:host to:", rule.selector);
      }

      // إزالة selectors غير المدعومة (pseudo selectors)
      if (!isSupportedSelector(rule.selector)) {
        log("Removing unsupported selector:", rule.selector);
        return rule.remove();
      }

      // معالجة ::placeholder
      if (isPlaceholderSelector(rule.selector)) {
        const placeholderSelectors = [];

        rule.selectors.forEach((selector) => {
          if (isPlaceholderSelector(selector)) {
            const cleaned = selector.replace(/::placeholder/g, "").trim();
            if (cleaned) {
              placeholderSelectors.push(cleaned);
            }
          }
        });

        if (placeholderSelectors.length === 0) {
          return rule.remove();
        }

        rule.selectors = placeholderSelectors;

        // تحويل color إلى placeholder-color
        rule.walkDecls((decl) => {
          if (decl.prop === "color") {
            decl.replaceWith(decl.clone({ prop: "placeholder-color" }));
          }
        });
      }

      // إزالة :where() wrapper - مُقدم في Tailwind 3.4+
      if (rule.selector.includes(":where(")) {
        rule.selectors = rule.selectors.map((selector) =>
          selector.replace(/:where\((.+?)\)/g, "$1")
        );
      }

      // تحويل space/divide selectors
      if (rule.selector.includes(":not(:last-child)")) {
        rule.selectors = rule.selectors.map((selector) =>
          selector.replace(/:not\(:last-child\)/g, "* + *")
        );
      }

      if (rule.selector.includes(":not([hidden]) ~ :not([hidden])")) {
        rule.selectors = rule.selectors.map((selector) =>
          selector.replace(/:not\(\[hidden\]\) ~ :not\(\[hidden\]\)/g, "* + *")
        );
      }
    },

    // ========================================
    // معالجة Declarations (Properties)
    // ========================================
    Declaration(decl) {
      // تحويل visibility: hidden إلى collapse
      if (decl.prop === "visibility" && decl.value === "hidden") {
        return decl.replaceWith(decl.clone({ value: "collapse" }));
      }

      // تحويل vertical-align: middle إلى center
      if (decl.prop === "vertical-align" && decl.value === "middle") {
        return decl.replaceWith(decl.clone({ value: "center" }));
      }

      // إزالة متغيرات divide/space
      const divideSpacePattern = /--tw-(divide|space)-[xy]-reverse/;
      if (
        decl.prop?.match(divideSpacePattern) &&
        decl.parent?.selector?.match(/\.(divide|space)-[xy]/)
      ) {
        return decl.remove();
      }

      // إزالة placeholder-color مع color-mix (غير مدعوم حالياً)
      if (
        decl.prop === "placeholder-color" &&
        decl.value?.includes("color-mix")
      ) {
        return decl.remove();
      }

      // إزالة currentColor (غير مدعوم حالياً)
      if (decl.value?.includes("currentColor")) {
        return decl.remove();
      }

      // إزالة CSS Variables غير المدعومة
      if (decl.prop?.startsWith("--")) {
        if (
          UNSUPPORTED_VAR_PATTERNS.some((pattern) =>
            decl.prop.includes(pattern)
          )
        ) {
          return decl.remove();
        }

        // تحويل Tailwind color variables إلى hex
        // مثال: --color-red-500: oklch(...) -> --color-red-500: #ef4444
        const precomputedHex = getTailwindHexColor(decl.prop);
        if (precomputedHex) {
          decl.value = precomputedHex;
          log(
            "Converted Tailwind color variable:",
            decl.prop,
            "->",
            decl.value
          );
          return;
        }
      }

      // تحويل rem/em إلى pixels
      if (decl.value?.includes("rem") || decl.value?.includes("em")) {
        decl.value = convertRemToPixels(decl.value);
        log("Converted rem/em:", decl.prop, "->", decl.value);
      }

      // تحويل oklch إلى hex (NativeScript لا يدعم oklch)
      // يستخدم للألوان المخصصة غير الموجودة في Tailwind
      if (decl.value?.includes("oklch")) {
        decl.value = convertOklchToHex(decl.value);
        log("Converted oklch to hex:", decl.prop, "->", decl.value);
      }

      // إزالة الخصائص غير المدعومة (باستثناء CSS Variables)
      if (
        !decl.prop?.startsWith("--") &&
        !isSupportedProperty(decl.prop, decl.value)
      ) {
        log("Removing unsupported property:", decl.prop);
        return decl.remove();
      }
    },
  };
};

cleanNativePlugin.postcss = true;

export default cleanNativePlugin;
