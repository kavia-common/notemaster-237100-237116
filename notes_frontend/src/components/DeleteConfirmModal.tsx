'use client';

/**
 * DeleteConfirmModal Component - Confirmation dialog for deleting notes.
 * Retro-themed modal with confirm/cancel actions.
 */

import React from 'react';

interface DeleteConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Title of the note being deleted */
  noteTitle: string;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Callback when deletion is cancelled */
  onCancel: () => void;
}

// PUBLIC_INTERFACE
/**
 * Modal dialog that asks the user to confirm note deletion.
 * Shows the note title and provides confirm/cancel buttons.
 */
export default function DeleteConfirmModal({
  isOpen,
  noteTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="retro-card relative w-full max-w-sm p-6 text-center"
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm deletion"
      >
        <div className="text-4xl mb-3">🗑️</div>
        <h3 className="text-lg font-bold uppercase mb-2">Delete Note?</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Are you sure you want to delete{' '}
          <strong className="text-[var(--color-text)]">
            &ldquo;{noteTitle || 'Untitled'}&rdquo;
          </strong>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            className="retro-btn px-4 py-2 bg-[var(--color-surface)] text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="retro-btn px-4 py-2 bg-[var(--color-error)] text-white text-sm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
