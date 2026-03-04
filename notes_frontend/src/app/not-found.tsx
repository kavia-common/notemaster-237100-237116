import React from "react";
import Link from "next/link";

/**
 * Custom 404 page with retro theme styling.
 */

// PUBLIC_INTERFACE
/**
 * NotFound page displayed when a user navigates to a non-existent route.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="retro-card p-8 text-center max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">
          404 - Page Not Found
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          The page you&apos;re looking for doesn&apos;t exist in this notebook.
        </p>
        <Link
          href="/"
          className="retro-btn inline-block px-6 py-2 bg-[var(--color-accent)] text-white text-sm"
        >
          ← Back to Notes
        </Link>
      </div>
    </main>
  );
}
