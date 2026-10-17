import localFont from "next/font/local";

export const iosevka = localFont({
  src: [
    { path: "./IosevkaSS08-Regular.woff2", weight: "400", style: "normal" },
    { path: "./IosevkaSS08-Italic.woff2", weight: "400", style: "italic" },
    { path: "./IosevkaSS08-Bold.woff2", weight: "700", style: "normal" },
    { path: "./IosevkaSS08-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  // Leaves emoji to an emoji font where the "Colour Emoji" face finds none, as on Android.
  declarations: [{ prop: "unicode-range", value: "U+0-1EFFF, U+1FB00-10FFFF" }],
  display: "swap",
  fallback: ["monospace"],
  variable: "--font-iosevka",
});
