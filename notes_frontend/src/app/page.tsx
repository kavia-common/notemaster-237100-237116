'use client';

/**
 * Home Page - Main application entry point.
 * Integrates Sidebar, NoteEditor, Settings, and floating action button
 * into a responsive retro-themed notes application.
 */

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import NoteEditor from '@/components/NoteEditor';
import SettingsModal from '@/components/SettingsModal';
import FloatingNewNoteButton from '@/components/FloatingNewNoteButton';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useNotes } from '@/hooks/useNotes';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// PUBLIC_INTERFACE
/**
 * Home component - The main app page that orchestrates all sub-components.
 * Manages sidebar visibility, modals, and delegates data operations to useNotes hook.
 */
export default function Home() {
  const {
    notes,
    tags,
    activeNote,
    activeNoteId,
    filter,
    isLoaded,
    setActiveNoteId,
    setFilter,
    createNote,
    updateNoteContent,
    removeNote,
    createTag,
    removeTag,
    toggleNoteTag,
  } = useNotes();

  const isOnline = useOnlineStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  /** Handle creating a new note */
  const handleCreateNote = useCallback(() => {
    createNote();
    setSidebarOpen(false);
  }, [createNote]);

  /** Initiate note deletion (show confirmation) */
  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  /** Confirm note deletion */
  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      removeNote(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, removeNote]);

  /** Cancel note deletion */
  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // Find the note being deleted for the confirmation modal
  const noteToDelete = deleteTarget
    ? notes.find((n) => n.id === deleteTarget)
    : null;

  // Loading state
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="retro-card p-8 text-center">
          <div className="text-4xl mb-3 blink-cursor">📝</div>
          <p className="text-lg font-bold uppercase tracking-wider">Loading NoteMaster...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar */}
      <Sidebar
        notes={notes}
        tags={tags}
        activeNoteId={activeNoteId}
        filter={filter}
        isOnline={isOnline}
        onSelectNote={setActiveNoteId}
        onFilterChange={setFilter}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteRequest}
        onOpenSettings={() => setSettingsOpen(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main editor area */}
      <NoteEditor
        note={activeNote}
        tags={tags}
        onUpdateNote={updateNoteContent}
        onToggleTag={toggleNoteTag}
        onCreateTag={createTag}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* Floating new note button */}
      <FloatingNewNoteButton onClick={handleCreateNote} />

      {/* Settings modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tags={tags}
        onDeleteTag={removeTag}
        onCreateTag={createTag}
        isOnline={isOnline}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        noteTitle={noteToDelete?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </main>
  );
}
