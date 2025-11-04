import "@/global.css";

import { iosevka } from "@/assets/fonts";
import { config } from "@/config";
import { GoogleTagManager } from "@next/third-parties/google";
import type { PropsWithChildren } from "react";

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <html lang="en" className={iosevka.className}>
      <GoogleTagManager gtmId={config.gtmId} />
      <body>{children}</body>
    </html>
  );
};
