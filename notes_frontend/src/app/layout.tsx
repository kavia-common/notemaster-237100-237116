import type { Metadata } from "next";
import "./globals.css";

/**
 * Root layout for the NoteMaster application.
 * Sets up the HTML document with retro theme metadata.
 */
export const metadata: Metadata = {
  title: "NoteMaster - Retro Notes App",
  description:
    "A local-first retro-themed notes application with markdown support, tagging, search, and optional cloud sync.",
  keywords: ["notes", "markdown", "retro", "local-first", "offline"],
};

// PUBLIC_INTERFACE
/**
 * RootLayout wraps all pages with the base HTML structure,
 * global CSS, and common providers.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect for potential future font loading */}
        <meta name="theme-color" content="#fdf6e3" />
        <meta name="color-scheme" content="light" />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
