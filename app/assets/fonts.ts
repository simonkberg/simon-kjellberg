import localFont from "next/font/local";

export const iosevka = localFont({
  src: [
    { path: "./IosevkaSS08-Regular.woff2", weight: "400", style: "normal" },
    { path: "./IosevkaSS08-Italic.woff2", weight: "400", style: "italic" },
    { path: "./IosevkaSS08-Bold.woff2", weight: "700", style: "normal" },
    { path: "./IosevkaSS08-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  // Everything but the "Colour Emoji" face's range in global.css, so where that face finds no
  // font, as on Android, emoji fall back to an emoji font instead of Iosevka's text glyphs.
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0-200C, U+200E-2319, U+231C-23E8, U+23ED-23EF, U+23F1-23F2, U+23F4-25FC, U+25FF-2613, U+2616-2647, U+2654-267E, U+2680-2692, U+2694-26A0, U+26A2-26A9, U+26AC-26BC, U+26BF-26C3, U+26C6-26CD, U+26CF-26D3, U+26D5-26E9, U+26EB-26F1, U+26F4, U+26F6-26F9, U+26FB-26FC, U+26FE-2704, U+2706-2709, U+270C-2727, U+2729-274B, U+274D, U+274F-2752, U+2756, U+2758-2763, U+2765-2794, U+2798-27AF, U+27B1-27BE, U+27C0-2B1A, U+2B1D-2B4F, U+2B51-2B54, U+2B56-FE0E, U+FE10-1EFFF, U+1FB00-E001F, U+E0080-10FFFF",
    },
  ],
  display: "swap",
  fallback: ["monospace"],
  variable: "--font-iosevka",
});
