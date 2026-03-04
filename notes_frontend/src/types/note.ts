/**
 * Core type definitions for the Notes application.
 * Defines the shape of Note, Tag, and related data structures.
 */

// PUBLIC_INTERFACE
/** Represents a tag that can be applied to notes */
export interface Tag {
  /** Unique identifier for the tag */
  id: string;
  /** Display name of the tag */
  name: string;
  /** Color code for the tag (hex) */
  color: string;
}

// PUBLIC_INTERFACE
/** Represents a single note in the application */
export interface Note {
  /** Unique identifier for the note */
  id: string;
  /** Title of the note */
  title: string;
  /** Markdown content of the note */
  content: string;
  /** Array of tag IDs associated with this note */
  tags: string[];
  /** ISO timestamp of when the note was created */
  createdAt: string;
  /** ISO timestamp of when the note was last updated */
  updatedAt: string;
  /** Whether this note has been synced to the server */
  synced: boolean;
  /** Whether this note is marked as deleted (soft delete) */
  deleted: boolean;
}

// PUBLIC_INTERFACE
/** Represents the user's auth state */
export interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** User's email if authenticated */
  email: string | null;
  /** Auth token for API calls */
  token: string | null;
}

// PUBLIC_INTERFACE
/** Represents the app's sync status */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// PUBLIC_INTERFACE
/** Sort options for notes list */
export type NoteSortOption = 'updatedAt' | 'createdAt' | 'title';

// PUBLIC_INTERFACE
/** Filter configuration for notes */
export interface NoteFilter {
  /** Search query string */
  searchQuery: string;
  /** Selected tag IDs to filter by */
  selectedTags: string[];
  /** Sort by field */
  sortBy: NoteSortOption;
  /** Sort direction */
  sortDirection: 'asc' | 'desc';
}
