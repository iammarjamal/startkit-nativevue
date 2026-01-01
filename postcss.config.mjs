/**
 * PostCSS Configuration for NativeScript + Tailwind CSS
 *
 * يستخدم PostCSS Pipeline لتوليد CSS متوافق مع NativeScript
 * جميع الـ plugins بصيغة ES Modules
 *
 * @type {import('postcss-load-config').Config}
 */

import tailwindcss from "@tailwindcss/postcss";
import cleanNative from "./postcss-plugins/clean-native.mjs";
import expandAnimations from "./postcss-plugins/expand-animations.mjs";

// تفعيل وضع التصحيح عبر متغير البيئة
const DEBUG = process.env.POSTCSS_DEBUG === "true";

export default {
  plugins: [
    // 1. Tailwind CSS - يولد الـ CSS الأساسي
    tailwindcss,

    // 2. تنظيف CSS لـ NativeScript
    // يحذف الـ selectors والخصائص غير المدعومة
    cleanNative({ debug: DEBUG }),

    // 3. تحويل animation shorthand
    // يفصل animation إلى خصائص فردية
    expandAnimations({ debug: DEBUG }),
  ],
};
