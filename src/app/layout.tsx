import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import { HandDrawnFilter } from "@/components/hand-drawn-filter";
import { UiStyleSync } from "@/components/ui-style-sync";
import { themeInitScript } from "@/lib/theme";
import { colorSchemeInitScript } from "@/lib/color-scheme-document";
import { uiStyleInitScript } from "@/lib/ui-style-document";
import "./globals.css";
import "./ui-style-skin.css";
import "./color-scheme-skin.css";
export const metadata: Metadata = {
  title: "BuildBlueprint — Build your project stack",
  description:
    "Choose your stack, check compatibility and export a complete implementation blueprint.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: uiStyleInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: colorSchemeInitScript }} />
        <HandDrawnFilter />
        <UiStyleSync />
        {children}
      </body>
    </html>
  );
}
