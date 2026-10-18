import "@/global.css";
import { GoogleTagManager } from "@next/third-parties/google";
import type { PropsWithChildren } from "react";

import { iosevka } from "@/assets/fonts";
import { config } from "@/config";
import {
  colorSchemes,
  grounds,
  preferencesScript,
  themePreference,
  variantPreference,
} from "@/lib/preferences";

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    // The head script swaps the data attributes before hydration.
    <html
      lang="en"
      className={iosevka.variable}
      data-variant={variantPreference.fallback}
      data-theme={themePreference.fallback}
      suppressHydrationWarning
    >
      <head>
        {/* Not viewport.themeColor: Next re-renders those on navigation, undoing the script. */}
        {colorSchemes.map((scheme) => (
          <meta
            key={scheme}
            name="theme-color"
            media={`(prefers-color-scheme: ${scheme})`}
            content={grounds[variantPreference.fallback][scheme]}
          />
        ))}
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
      </head>
      <GoogleTagManager gtmId={config.gtmId} />
      <body>{children}</body>
    </html>
  );
};
