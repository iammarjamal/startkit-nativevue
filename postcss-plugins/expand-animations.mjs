/**
 * PostCSS Plugin: expand-animations
 *
 * يحول animation shorthand إلى خصائص فردية
 * NativeScript يفضل الخصائص المنفصلة للـ animations
 *
 * @module expand-animations
 * @version 2.0.0 (ESM)
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { parseSingle, serialize } = require("@hookun/parse-animation-shorthand");

/**
 * يحول camelCase إلى kebab-case
 * @param {string} input
 * @returns {string}
 */
function camelToKebab(input) {
  return input.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * PostCSS Plugin لتحويل animation shorthand
 * @param {Object} options - خيارات البلجن
 * @param {boolean} options.debug - تفعيل وضع التصحيح
 * @returns {import('postcss').Plugin}
 */
const expandAnimationsPlugin = (options = { debug: false }) => {
  const { debug } = options;

  const log = (...args) => {
    if (debug) console.log("[expand-animations]", ...args);
  };

  return {
    postcssPlugin: "postcss-expand-animations",

    Declaration(decl) {
      // معالجة animation shorthand فقط
      if (decl.prop !== "animation") {
        return;
      }

      try {
        log("Processing animation:", decl.value);

        const styles = parseSingle(decl.value);

        // تحويل duration من milliseconds إلى seconds
        if (styles.duration && Number.isInteger(styles.duration)) {
          styles.duration = `${styles.duration / 1000}s`;
        }

        // معالجة القيم المعقدة (objects)
        Object.entries(styles)
          .filter(([, value]) => typeof value === "object")
          .forEach(([key, value]) => {
            styles[key] = serialize({ [key]: value }).split(" ")[0];
          });

        // إضافة الخصائص الفردية
        Object.entries(styles)
          .filter(([, value]) => value !== "unset" && value !== undefined)
          .forEach(([key, value]) => {
            const prop = `animation-${camelToKebab(key)}`;
            log("Adding property:", prop, "=", value);

            decl.parent.insertAfter(
              decl,
              decl.clone({
                prop,
                value: String(value),
              })
            );
          });

        // إزالة الـ shorthand الأصلي
        decl.remove();
      } catch (err) {
        // في حالة خطأ، نحتفظ بالـ animation كما هو
        log("Error parsing animation, keeping as-is:", err.message);
      }
    },
  };
};

expandAnimationsPlugin.postcss = true;

export default expandAnimationsPlugin;
