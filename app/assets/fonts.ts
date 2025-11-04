import localFont from "next/font/local";

export const iosevka = localFont({
  src: [
    {
      path: "./IosevkaSS08-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./IosevkaSS08-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./IosevkaSS08-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./IosevkaSS08-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  fallback: ["monospace"],
});
