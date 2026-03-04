/**
 * Sync Service - Handles optional synchronization with the backend API.
 * Provides methods for auth and note syncing when online and authenticated.
 */

import { AuthState } from '@/types/note';

// Backend API base URL - read from env or default
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// PUBLIC_INTERFACE
/**
 * Attempt to log in with email and password.
 * @param email - User email
 * @param password - User password
 * @returns AuthState with token if successful
 */
export async function login(email: string, password: string): Promise<AuthState> {
  if (!API_BASE) {
    // No backend configured - simulate offline
    return { isAuthenticated: false, email: null, token: null };
  }
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    return { isAuthenticated: true, email, token: data.token };
  } catch {
    return { isAuthenticated: false, email: null, token: null };
  }
}

// PUBLIC_INTERFACE
/**
 * Attempt to register a new account.
 * @param email - User email
 * @param password - User password
 * @returns AuthState with token if successful
 */
export async function register(email: string, password: string): Promise<AuthState> {
  if (!API_BASE) {
    return { isAuthenticated: false, email: null, token: null };
  }
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Registration failed');
    const data = await res.json();
    return { isAuthenticated: true, email, token: data.token };
  } catch {
    return { isAuthenticated: false, email: null, token: null };
  }
}

// PUBLIC_INTERFACE
/**
 * Log out the current user.
 * @returns Empty auth state
 */
export function logout(): AuthState {
  return { isAuthenticated: false, email: null, token: null };
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
