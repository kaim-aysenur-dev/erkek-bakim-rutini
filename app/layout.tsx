import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";
import "./sections.css";
import "./sections-2.css";
import "./sections-3.css";

// Başlıklar: yumuşak serif (SOFT ekseni açık). Metin ve sayılar: DM Sans (tabular rakamlar CSS'te).
const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "opsz"],
});
const body = DM_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Klavye açılınca düzen küçülsün, giriş butonu görünür kalsın
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#191613" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang="tr"
      data-theme={theme === "system" ? undefined : theme}
      className={`${display.variable} ${body.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
