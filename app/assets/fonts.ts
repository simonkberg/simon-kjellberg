import localFont from "next/font/local";

export const iosevka = localFont({
  src: [
    { path: "./IosevkaSS08-Regular.woff2", weight: "400", style: "normal" },
    { path: "./IosevkaSS08-Italic.woff2", weight: "400", style: "italic" },
    { path: "./IosevkaSS08-Bold.woff2", weight: "700", style: "normal" },
    { path: "./IosevkaSS08-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  // All but Emoji_Presentation, U+FE0F, the joiner and tags, so colour emoji use the platform's font.
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0-200C, U+200E-2319, U+231C-23E8, U+23ED-23EF, U+23F1-23F2, U+23F4-25FC, U+25FF-2613, U+2616-2647, U+2654-267E, U+2680-2692, U+2694-26A0, U+26A2-26A9, U+26AC-26BC, U+26BF-26C3, U+26C6-26CD, U+26CF-26D3, U+26D5-26E9, U+26EB-26F1, U+26F4, U+26F6-26F9, U+26FB-26FC, U+26FE-2704, U+2706-2709, U+270C-2727, U+2729-274B, U+274D, U+274F-2752, U+2756, U+2758-2794, U+2798-27AF, U+27B1-27BE, U+27C0-2B1A, U+2B1D-2B4F, U+2B51-2B54, U+2B56-FE0E, U+FE10-1F003, U+1F005-1F0CE, U+1F0D0-1F18D, U+1F18F-1F190, U+1F19B-1F1E5, U+1F200, U+1F202-1F219, U+1F21B-1F22E, U+1F230-1F231, U+1F237, U+1F23B-1F24F, U+1F252-1F2FF, U+1F321-1F32C, U+1F336, U+1F37D, U+1F394-1F39F, U+1F3CB-1F3CE, U+1F3D4-1F3DF, U+1F3F1-1F3F3, U+1F3F5-1F3F7, U+1F43F, U+1F441, U+1F4FD-1F4FE, U+1F53E-1F54A, U+1F54F, U+1F568-1F579, U+1F57B-1F594, U+1F597-1F5A3, U+1F5A5-1F5FA, U+1F650-1F67F, U+1F6C6-1F6CB, U+1F6CD-1F6CF, U+1F6D3-1F6D4, U+1F6D9-1F6DB, U+1F6E0-1F6EA, U+1F6ED-1F6F3, U+1F6FD-1F7DF, U+1F7EC-1F7EF, U+1F7F1-1F90B, U+1F93B, U+1F946, U+1FA00-1FA6F, U+1FA7D-1FA7F, U+1FA8B-1FA8D, U+1FAC7, U+1FAC9-1FACC, U+1FADD-1FADE, U+1FAEB-1FAEE, U+1FAF9-E001F, U+E0080-10FFFF",
    },
  ],
  display: "swap",
  fallback: ["monospace"],
  variable: "--font-iosevka",
});
