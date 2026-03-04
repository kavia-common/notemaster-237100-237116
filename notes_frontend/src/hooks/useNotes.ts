'use client';

/**
 * useNotes - Custom hook for managing notes state with local-first storage.
 * Handles CRUD operations, search, filtering, sorting, and autosave.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Note, NoteFilter, Tag } from '@/types/note';
import * as storage from '@/services/storageService';

const AUTOSAVE_DELAY = 1000; // 1 second debounce for autosave

// PUBLIC_INTERFACE
/**
 * Custom hook that manages the complete notes lifecycle.
 * Provides notes array, CRUD operations, filtering, and autosave.
 */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<NoteFilter>({
    searchQuery: '',
    selectedTags: [],
    sortBy: 'updatedAt',
    sortDirection: 'desc',
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes and tags from storage on mount
  useEffect(() => {
    setNotes(storage.getAllNotes());
    setTags(storage.getAllTags());
    setIsLoaded(true);
  }, []);

  /**
   * Create a new note with default values.
   * @returns The newly created Note
   */
  const createNote = useCallback((): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      synced: false,
      deleted: false,
    };
    storage.saveNote(newNote);
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  }, []);

  /**
   * Update a note with partial changes. Triggers autosave debounce.
   * @param id - The note ID to update
   * @param updates - Partial fields to update
   */
  const updateNoteContent = useCallback((id: string, updates: Partial<Note>) => {
    // Optimistic local state update
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString(), synced: false }
          : n
      )
    );

    // Debounced save to storage (autosave)
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = setTimeout(() => {
      storage.updateNote(id, updates);
    }, AUTOSAVE_DELAY);
  }, []);

  /**
   * Delete a note (soft delete).
   * @param id - The note ID to delete
   */
  const removeNote = useCallback(
    (id: string) => {
      storage.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    },
    [activeNoteId]
  );

  /**
   * Create a new tag.
   * @param name - Tag display name
   * @param color - Tag color hex code
   * @returns The created Tag
   */
  const createTag = useCallback((name: string, color: string): Tag => {
    const newTag: Tag = { id: uuidv4(), name, color };
    storage.saveTag(newTag);
    setTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  /**
   * Remove a tag and detach it from all notes.
   * @param id - The tag ID to remove
   */
  const removeTag = useCallback((id: string) => {
    storage.deleteTag(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        tags: n.tags.filter((tagId) => tagId !== id),
      }))
    );
  }, []);

  /**
   * Toggle a tag on/off for a specific note.
   * @param noteId - The note ID
   * @param tagId - The tag ID to toggle
   */
  const toggleNoteTag = useCallback((noteId: string, tagId: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const hasTags = n.tags.includes(tagId);
        const updatedTags = hasTags
          ? n.tags.filter((t) => t !== tagId)
          : [...n.tags, tagId];
        const updatedNote = { ...n, tags: updatedTags, updatedAt: new Date().toISOString(), synced: false };
        storage.saveNote(updatedNote);
        return updatedNote;
      })
    );
  }, []);

  // Get the currently active note object
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Apply filtering, search, and sorting
  const filteredNotes = notes
    .filter((note) => {
      // Search filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }
      // Tag filter
      if (filter.selectedTags.length > 0) {
        const hasMatchingTag = filter.selectedTags.some((tagId) =>
          note.tags.includes(tagId)
        );
        if (!hasMatchingTag) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const fieldA = a[filter.sortBy];
      const fieldB = b[filter.sortBy];
      const comparison = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
      return filter.sortDirection === 'desc' ? -comparison : comparison;
    });

  return {
    notes: filteredNotes,
    allNotes: notes,
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
  };
}
