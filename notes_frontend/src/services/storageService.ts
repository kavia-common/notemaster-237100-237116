/**
 * Storage Service - Handles local-first persistence using localStorage.
 * Provides CRUD operations for notes and tags with automatic serialization.
 */

import { Note, Tag } from '@/types/note';

const NOTES_STORAGE_KEY = 'notemaster_notes';
const TAGS_STORAGE_KEY = 'notemaster_tags';

/**
 * Safely check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely get data from localStorage with JSON parsing
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isBrowser()) return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set data to localStorage with JSON serialization
 */
function setToStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// ===== NOTES =====

// PUBLIC_INTERFACE
/**
 * Retrieve all notes from local storage (excluding soft-deleted).
 * @returns Array of Note objects
 */
export function getAllNotes(): Note[] {
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  return notes.filter((n) => !n.deleted);
}

// PUBLIC_INTERFACE
/**
 * Retrieve all notes including soft-deleted ones.
 * @returns Array of all Note objects
 */
export function getAllNotesIncludingDeleted(): Note[] {
  return getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
}

// PUBLIC_INTERFACE
/**
 * Get a single note by its ID.
 * @param id - The note ID to look up
 * @returns The Note or undefined if not found
 */
export function getNoteById(id: string): Note | undefined {
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  return notes.find((n) => n.id === id && !n.deleted);
}

// PUBLIC_INTERFACE
/**
 * Save a new note to local storage.
 * @param note - The Note object to save
 */
export function saveNote(note: Note): void {
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  const index = notes.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    notes[index] = note;
  } else {
    notes.push(note);
  }
  setToStorage(NOTES_STORAGE_KEY, notes);
}

// PUBLIC_INTERFACE
/**
 * Update an existing note. Merges partial updates with existing data.
 * @param id - The note ID to update
 * @param updates - Partial Note fields to update
 * @returns The updated Note or undefined if not found
 */
export function updateNote(id: string, updates: Partial<Note>): Note | undefined {
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  const index = notes.findIndex((n) => n.id === id);
  if (index < 0) return undefined;
  notes[index] = { ...notes[index], ...updates, updatedAt: new Date().toISOString(), synced: false };
  setToStorage(NOTES_STORAGE_KEY, notes);
  return notes[index];
}

// PUBLIC_INTERFACE
/**
 * Soft-delete a note by its ID.
 * @param id - The note ID to delete
 * @returns true if the note was found and deleted
 */
export function deleteNote(id: string): boolean {
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  const index = notes.findIndex((n) => n.id === id);
  if (index < 0) return false;
  notes[index] = { ...notes[index], deleted: true, updatedAt: new Date().toISOString(), synced: false };
  setToStorage(NOTES_STORAGE_KEY, notes);
  return true;
}

// PUBLIC_INTERFACE
/**
 * Permanently remove a note from storage.
 * @param id - The note ID to purge
 */
export function purgeNote(id: string): void {
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  setToStorage(NOTES_STORAGE_KEY, notes.filter((n) => n.id !== id));
}

// ===== TAGS =====

// PUBLIC_INTERFACE
/**
 * Retrieve all tags from local storage.
 * @returns Array of Tag objects
 */
export function getAllTags(): Tag[] {
  return getFromStorage<Tag[]>(TAGS_STORAGE_KEY, []);
}

// PUBLIC_INTERFACE
/**
 * Save a new tag to local storage.
 * @param tag - The Tag object to save
 */
export function saveTag(tag: Tag): void {
  const tags = getFromStorage<Tag[]>(TAGS_STORAGE_KEY, []);
  const index = tags.findIndex((t) => t.id === tag.id);
  if (index >= 0) {
    tags[index] = tag;
  } else {
    tags.push(tag);
  }
  setToStorage(TAGS_STORAGE_KEY, tags);
}

// PUBLIC_INTERFACE
/**
 * Delete a tag by ID and remove it from all notes.
 * @param id - The tag ID to remove
 */
export function deleteTag(id: string): void {
  const tags = getFromStorage<Tag[]>(TAGS_STORAGE_KEY, []);
  setToStorage(TAGS_STORAGE_KEY, tags.filter((t) => t.id !== id));

  // Remove tag from all notes
  const notes = getFromStorage<Note[]>(NOTES_STORAGE_KEY, []);
  const updatedNotes = notes.map((n) => ({
    ...n,
    tags: n.tags.filter((tagId) => tagId !== id),
  }));
  setToStorage(NOTES_STORAGE_KEY, updatedNotes);
}
