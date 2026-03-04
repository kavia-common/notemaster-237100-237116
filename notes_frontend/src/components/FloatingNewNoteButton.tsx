'use client';

/**
 * FloatingNewNoteButton Component - A retro-styled floating action button
 * for creating new notes. Fixed position in the bottom-right corner.
 */

import React from 'react';

interface FloatingNewNoteButtonProps {
  /** Callback when the button is clicked to create a new note */
  onClick: () => void;
}

// PUBLIC_INTERFACE
/**
 * Floating action button that creates a new note when clicked.
 * Positioned at the bottom-right corner with retro pixel styling.
 */
export default function FloatingNewNoteButton({ onClick }: FloatingNewNoteButtonProps) {
  return (
    <button
      className="fixed bottom-6 right-6 z-20 w-14 h-14 
        bg-[var(--color-accent)] text-white text-2xl font-bold
        border-[3px] border-[var(--color-border-dark)]
        shadow-[4px_4px_0px_var(--color-border-dark)]
        hover:shadow-[2px_2px_0px_var(--color-border-dark)]
        hover:translate-x-[2px] hover:translate-y-[2px]
        active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
        transition-all duration-100 flex items-center justify-center
        cursor-pointer"
      onClick={onClick}
      aria-label="Create new note"
      title="Create new note"
    >
      ✚
    </button>
  );
}
