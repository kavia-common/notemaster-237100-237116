/**
 * Sync Service - Handles optional synchronization with the backend API.
 * Provides methods for auth (login/register/logout), note sync (push/pull),
 * and backend health checking. Matches the FastAPI backend at :3001.
 */

import { AuthState, Note, Tag } from '@/types/note';

// Backend API base URL - read from NEXT_PUBLIC_API_BASE env variable
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

/** Storage key for persisted auth state */
const AUTH_STORAGE_KEY = 'notemaster_auth';

/**
 * Helper to safely access localStorage (SSR-safe)
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// PUBLIC_INTERFACE
/**
 * Load persisted auth state from localStorage.
 * @returns The stored AuthState, or a default unauthenticated state.
 */
export function loadAuthState(): AuthState {
  if (!isBrowser()) {
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { isAuthenticated: false, email: null, token: null, username: null };
    return JSON.parse(raw) as AuthState;
  } catch {
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
}

/**
 * Persist auth state to localStorage.
 */
function saveAuthState(state: AuthState): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save auth state:', e);
  }
}

/**
 * Build an Authorization header object for authenticated requests.
 * @param token - JWT access token
 * @returns Headers object with Bearer token
 */
function authHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// PUBLIC_INTERFACE
/**
 * Attempt to log in with username/email and password.
 * Backend expects { username, password } where username can be email.
 * Returns { access_token, token_type, user } on success.
 * @param emailOrUsername - User email or username
 * @param password - User password
 * @returns AuthState with token if successful
 */
export async function login(emailOrUsername: string, password: string): Promise<AuthState> {
  if (!API_BASE) {
    // No backend configured - return unauthenticated
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: emailOrUsername, password }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const msg = errBody?.detail || 'Login failed';
      throw new Error(typeof msg === 'string' ? msg : 'Login failed');
    }
    const data = await res.json();
    // Backend returns: { access_token, token_type, user: { id, username, email, ... } }
    const state: AuthState = {
      isAuthenticated: true,
      email: data.user?.email || emailOrUsername,
      token: data.access_token,
      username: data.user?.username || null,
    };
    saveAuthState(state);
    return state;
  } catch (err) {
    console.error('Login error:', err);
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
}

// PUBLIC_INTERFACE
/**
 * Attempt to register a new account.
 * Backend expects { username, email, password, display_name? }.
 * Returns { access_token, token_type, user } on success.
 * @param username - Unique username (3+ chars)
 * @param email - User email
 * @param password - User password (6+ chars)
 * @returns AuthState with token if successful
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthState> {
  if (!API_BASE) {
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const msg = errBody?.detail || 'Registration failed';
      throw new Error(typeof msg === 'string' ? msg : 'Registration failed');
    }
    const data = await res.json();
    // Backend returns: { access_token, token_type, user: { id, username, email, ... } }
    const state: AuthState = {
      isAuthenticated: true,
      email: data.user?.email || email,
      token: data.access_token,
      username: data.user?.username || username,
    };
    saveAuthState(state);
    return state;
  } catch (err) {
    console.error('Register error:', err);
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
}

// PUBLIC_INTERFACE
/**
 * Log out the current user. Clears persisted auth state.
 * @returns Empty auth state
 */
export function logout(): AuthState {
  const state: AuthState = { isAuthenticated: false, email: null, token: null, username: null };
  saveAuthState(state);
  return state;
}

// PUBLIC_INTERFACE
/**
 * Verify the current token by calling /auth/me.
 * @param token - JWT access token
 * @returns AuthState with user info if valid, unauthenticated state if not
 */
export async function verifyToken(token: string): Promise<AuthState> {
  if (!API_BASE || !token) {
    return { isAuthenticated: false, email: null, token: null, username: null };
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Token invalid');
    const user = await res.json();
    const state: AuthState = {
      isAuthenticated: true,
      email: user.email,
      token,
      username: user.username,
    };
    saveAuthState(state);
    return state;
  } catch {
    // Token is invalid, clear it
    const state: AuthState = { isAuthenticated: false, email: null, token: null, username: null };
    saveAuthState(state);
    return state;
  }
}

// PUBLIC_INTERFACE
/**
 * Check if the backend API is reachable.
 * @returns true if the backend health check passes
 */
export async function checkBackendHealth(): Promise<boolean> {
  if (!API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Shape of a note item pushed to the /sync/push endpoint.
 * Must match the SyncNoteItem schema on the backend.
 */
interface SyncNotePayload {
  local_id: string;
  title: string;
  content: string;
  content_type: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  updated_at: string;
  tag_names: string[] | null;
}

/**
 * Response from /sync/push endpoint.
 */
interface SyncPushResult {
  synced_count: number;
  errors: string[];
  server_timestamp: string;
}

/**
 * Shape of a note item returned from /sync/pull.
 * Matches NoteResponse schema on the backend.
 */
interface ServerNoteResponse {
  id: string;
  title: string;
  content: string;
  content_type: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  local_id: string | null;
  created_at: string;
  updated_at: string;
  tags: Array<{ id: string; name: string; color: string | null; created_at: string }>;
}

/**
 * Response from /sync/pull endpoint.
 */
interface SyncPullResult {
  notes: ServerNoteResponse[];
  server_timestamp: string;
}

// PUBLIC_INTERFACE
/**
 * Push local notes to the server for synchronization.
 * Converts local Note[] to the backend SyncNoteItem[] format.
 * @param notes - Local notes to push (including deleted ones)
 * @param tags - All local tags (used to resolve tag IDs to names)
 * @param token - JWT access token
 * @param lastSyncAt - ISO timestamp of last successful sync, or null
 * @returns The push result with synced_count and server_timestamp, or null on failure
 */
export async function pushNotes(
  notes: Note[],
  tags: Tag[],
  token: string,
  lastSyncAt: string | null
): Promise<SyncPushResult | null> {
  if (!API_BASE || !token) return null;

  // Convert local notes to the backend payload format
  const notePayloads: SyncNotePayload[] = notes.map((note) => {
    // Resolve tag IDs to tag names for the backend
    const tagNames = note.tags
      .map((tagId) => tags.find((t) => t.id === tagId)?.name)
      .filter((name): name is string => !!name);

    return {
      local_id: note.id,
      title: note.title,
      content: note.content,
      content_type: 'markdown',
      is_pinned: false,
      is_archived: false,
      is_deleted: note.deleted,
      updated_at: note.updatedAt,
      tag_names: tagNames.length > 0 ? tagNames : null,
    };
  });

  try {
    const res = await fetch(`${API_BASE}/sync/push`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        notes: notePayloads,
        last_sync_at: lastSyncAt,
      }),
    });
    if (!res.ok) throw new Error('Sync push failed');
    return await res.json();
  } catch (err) {
    console.error('Sync push error:', err);
    return null;
  }
}

// PUBLIC_INTERFACE
/**
 * Pull notes from the server that have been updated since the given timestamp.
 * Converts server NoteResponse[] to local Note[] format.
 * @param token - JWT access token
 * @param since - ISO timestamp to pull updates from, or null for all notes
 * @returns Object with notes and server_timestamp, or null on failure
 */
export async function pullNotes(
  token: string,
  since: string | null
): Promise<{ notes: Note[]; tags: Tag[]; serverTimestamp: string } | null> {
  if (!API_BASE || !token) return null;

  try {
    const url = new URL(`${API_BASE}/sync/pull`);
    if (since) {
      url.searchParams.set('since', since);
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: authHeaders(token),
    });
    if (!res.ok) throw new Error('Sync pull failed');
    const data: SyncPullResult = await res.json();

    // Convert server notes to local Note format
    const pulledNotes: Note[] = data.notes.map((sn) => ({
      id: sn.local_id || sn.id, // prefer local_id if available
      title: sn.title,
      content: sn.content,
      tags: sn.tags.map((t) => t.id),
      createdAt: sn.created_at,
      updatedAt: sn.updated_at,
      synced: true,
      deleted: sn.is_deleted,
    }));

    // Extract unique tags from pulled notes
    const tagMap = new Map<string, Tag>();
    data.notes.forEach((sn) => {
      sn.tags.forEach((t) => {
        if (!tagMap.has(t.id)) {
          tagMap.set(t.id, { id: t.id, name: t.name, color: t.color || '#3b82f6' });
        }
      });
    });

    return {
      notes: pulledNotes,
      tags: Array.from(tagMap.values()),
      serverTimestamp: data.server_timestamp,
    };
  } catch (err) {
    console.error('Sync pull error:', err);
    return null;
  }
}

/** Storage key for last sync timestamp */
const LAST_SYNC_KEY = 'notemaster_last_sync';

// PUBLIC_INTERFACE
/**
 * Get the last successful sync timestamp.
 * @returns ISO timestamp string or null
 */
export function getLastSyncTimestamp(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

// PUBLIC_INTERFACE
/**
 * Save the last successful sync timestamp.
 * @param timestamp - ISO timestamp string
 */
export function setLastSyncTimestamp(timestamp: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(LAST_SYNC_KEY, timestamp);
}
