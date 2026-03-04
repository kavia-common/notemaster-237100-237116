'use client';

/**
 * Home Page - Main application entry point.
 * Integrates Sidebar, NoteEditor, Settings, and floating action button
 * into a responsive retro-themed notes application.
 * Wires auth state and sync to the SettingsModal and useNotes hook.
 */

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import NoteEditor from '@/components/NoteEditor';
import SettingsModal from '@/components/SettingsModal';
import FloatingNewNoteButton from '@/components/FloatingNewNoteButton';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useNotes } from '@/hooks/useNotes';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { AuthState, SyncStatus } from '@/types/note';
import * as syncService from '@/services/syncService';

// PUBLIC_INTERFACE
/**
 * Home component - The main app page that orchestrates all sub-components.
 * Manages sidebar visibility, modals, auth state, sync status,
 * and delegates data operations to useNotes hook.
 */
export default function Home() {
  const {
    notes,
    allNotes,
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
    mergeFromServer,
    markAllSynced,
  } = useNotes();

  const isOnline = useOnlineStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Auth & sync state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    email: null,
    token: null,
    username: null,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // Load persisted auth state on mount and verify token
  useEffect(() => {
    const persisted = syncService.loadAuthState();
    if (persisted.isAuthenticated && persisted.token) {
      // Verify the token is still valid
      syncService.verifyToken(persisted.token).then((verified) => {
        setAuthState(verified);
      });
    }
  }, []);

  /** Handle auth state changes from SettingsModal */
  const handleAuthChange = useCallback((state: AuthState) => {
    setAuthState(state);
  }, []);

  /**
   * Perform a full sync cycle: push local changes, then pull server changes.
   * Called manually from SettingsModal or could be triggered automatically.
   */
  const handleSyncRequest = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.token || !isOnline) {
      return;
    }

    setSyncStatus('syncing');

    try {
      const lastSync = syncService.getLastSyncTimestamp();

      // Step 1: Push local unsynced notes to server
      // Include all notes (even deleted ones) so server knows about deletions
      const allNotesIncludingDeleted = allNotes;
      const unsyncedNotes = allNotesIncludingDeleted.filter((n) => !n.synced);

      if (unsyncedNotes.length > 0) {
        const pushResult = await syncService.pushNotes(
          unsyncedNotes,
          tags,
          authState.token,
          lastSync
        );
        if (pushResult) {
          markAllSynced();
          if (pushResult.errors.length > 0) {
            console.warn('Sync push had errors:', pushResult.errors);
          }
        }
      }

      // Step 2: Pull server changes
      const pullResult = await syncService.pullNotes(authState.token, lastSync);
      if (pullResult) {
        mergeFromServer(pullResult.notes, pullResult.tags);
        syncService.setLastSyncTimestamp(pullResult.serverTimestamp);
      }

      setSyncStatus('idle');
    } catch (err) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      // Reset error status after a delay
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [authState, isOnline, allNotes, tags, markAllSynced, mergeFromServer]);

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

      {/* Settings modal with auth and sync wired */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tags={tags}
        onDeleteTag={removeTag}
        onCreateTag={createTag}
        isOnline={isOnline}
        onSyncRequest={handleSyncRequest}
        syncStatus={syncStatus}
        authState={authState}
        onAuthChange={handleAuthChange}
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
