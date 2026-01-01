/**
 * PostCSS Plugin: clean-native
 *
 * يقوم بتنظيف CSS الناتج من Tailwind ليكون متوافقاً مع NativeScript
 * يحذف الـ Selectors غير المدعومة ويعالج القيم والخصائص
 *
 * @module clean-native
 * @version 2.0.0 (ESM)
 */

// ============================================
// Constants & Configuration
// ============================================

const REM_REGEX = /\d?\.?\d+\s*r?em/g;

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
       * - تحويل prefers-color-scheme: dark إلى .dark class selector
       * - حذف باقي الـ @media rules
       */
      media(atRule) {
        // تحويل dark mode media query إلى class-based
        if (atRule.params.includes("prefers-color-scheme: dark")) {
          log("Converting dark mode @media to class-based");

          // في Tailwind v4، البنية هي:
          // .dark\:bg-black { @media (...) { background-color: ... } }
          // نحتاج لرفع المحتوى الداخلي للـ parent rule

          const parentRule = atRule.parent;
          if (parentRule && parentRule.type === "rule") {
            // نسخ الـ declarations من داخل @media إلى الـ parent rule
            atRule.walkDecls((decl) => {
              parentRule.append(decl.clone());
            });

            // تحويل selector من .dark\:bg-black إلى .dark .bg-black
            parentRule.selectors = parentRule.selectors.map((selector) => {
              // .dark\:bg-black -> .dark .bg-black
              const cleanSelector = selector.replace(/\.dark\\:/g, ".");
              return `.dark ${cleanSelector}`;
            });

            log("New selector:", parentRule.selector);
          }

          // حذف @media rule
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
      }

      // تحويل rem/em إلى pixels
      if (decl.value?.includes("rem") || decl.value?.includes("em")) {
        decl.value = convertRemToPixels(decl.value);
        log("Converted rem/em:", decl.prop, "->", decl.value);
      }

      // تحويل oklch إلى hex (NativeScript لا يدعم oklch)
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
