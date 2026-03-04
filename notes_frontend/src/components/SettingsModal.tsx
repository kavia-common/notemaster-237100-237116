'use client';

/**
 * SettingsModal Component - Modal for app settings, tag management, and account/sync UI.
 * Features retro-themed styling with pixel borders.
 * Integrates with backend auth (register/login) and sync (push/pull) endpoints.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, AuthState, SyncStatus } from '@/types/note';
import * as syncService from '@/services/syncService';

interface SettingsModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** All tags */
  tags: Tag[];
  /** Callback to delete a tag */
  onDeleteTag: (id: string) => void;
  /** Callback to create a tag */
  onCreateTag: (name: string, color: string) => void;
  /** Whether the app is online */
  isOnline: boolean;
  /** Callback to trigger sync from parent */
  onSyncRequest?: () => Promise<void>;
  /** Current sync status from parent */
  syncStatus?: SyncStatus;
  /** Current auth state from parent */
  authState?: AuthState;
  /** Callback to update auth state in parent */
  onAuthChange?: (state: AuthState) => void;
}

/** Predefined retro tag colors */
const TAG_COLORS = [
  '#d97706', '#dc2626', '#16a34a', '#2563eb',
  '#9333ea', '#db2777', '#0d9488', '#ca8a04',
];

// PUBLIC_INTERFACE
/**
 * SettingsModal provides UI for managing tags, account authentication,
 * and sync settings. Includes login/register forms for optional sync.
 * Wired to backend /auth/register, /auth/login endpoints with proper
 * request shapes (username, email, password).
 */
export default function SettingsModal({
  isOpen,
  onClose,
  tags,
  onDeleteTag,
  onCreateTag,
  isOnline,
  onSyncRequest,
  syncStatus = 'idle',
  authState: externalAuth,
  onAuthChange,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'tags' | 'account'>('tags');

  // Use external auth state if provided, otherwise manage internally
  const [internalAuth, setInternalAuth] = useState<AuthState>({
    isAuthenticated: false,
    email: null,
    token: null,
    username: null,
  });
  const auth = externalAuth || internalAuth;

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Load persisted auth state on mount
  useEffect(() => {
    if (!externalAuth) {
      const persisted = syncService.loadAuthState();
      if (persisted.isAuthenticated) {
        setInternalAuth(persisted);
      }
    }
  }, [externalAuth]);

  /** Update auth state in both internal and external (parent) state */
  const updateAuth = useCallback((state: AuthState) => {
    setInternalAuth(state);
    if (onAuthChange) {
      onAuthChange(state);
    }
  }, [onAuthChange]);

  if (!isOpen) return null;

  /** Handle login attempt - backend expects { username, password } */
  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    // Backend /auth/login takes { username, password }; username can be email
    const result = await syncService.login(email, password);
    setAuthLoading(false);
    if (result.isAuthenticated) {
      updateAuth(result);
      setEmail('');
      setPassword('');
    } else {
      setAuthError('Login failed. Check credentials or try again later.');
    }
  };

  /** Handle register attempt - backend expects { username, email, password } */
  const handleRegister = async () => {
    if (!username || !email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }
    if (username.length < 3) {
      setAuthError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const result = await syncService.register(username, email, password);
    setAuthLoading(false);
    if (result.isAuthenticated) {
      updateAuth(result);
      setEmail('');
      setUsername('');
      setPassword('');
      setIsRegistering(false);
    } else {
      setAuthError('Registration failed. Username or email may already be taken.');
    }
  };

  /** Handle logout */
  const handleLogout = () => {
    updateAuth(syncService.logout());
  };

  /** Handle manual sync trigger */
  const handleSync = async () => {
    if (onSyncRequest) {
      await onSyncRequest();
    }
  };

  /** Handle creating a new tag from settings */
  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    onCreateTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="retro-card relative w-full max-w-lg max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-[3px] border-[var(--color-border-dark)]">
          <h2 className="text-lg font-bold uppercase tracking-wider">⚙️ Settings</h2>
          <button
            className="retro-btn px-3 py-1 bg-[var(--color-surface)] text-sm"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-[3px] border-[var(--color-border-dark)]">
          <button
            className={`flex-1 px-4 py-2 text-sm font-bold uppercase ${
              activeTab === 'tags'
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
            }`}
            onClick={() => setActiveTab('tags')}
          >
            🏷️ Tags
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-bold uppercase border-l-[3px] border-[var(--color-border-dark)] ${
              activeTab === 'account'
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
            }`}
            onClick={() => setActiveTab('account')}
          >
            👤 Account
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'tags' && (
            <div>
              <h3 className="text-sm font-bold uppercase mb-3 border-b-2 border-dashed border-[var(--color-border)] pb-2">
                Manage Tags
              </h3>

              {/* Create new tag */}
              <div className="mb-4 p-3 bg-[var(--color-editor-bg)] border-2 border-[var(--color-border)]">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="New tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    className="retro-input flex-1 px-2 py-1 text-sm"
                    maxLength={20}
                  />
                  <button
                    className="retro-btn px-3 py-1 text-sm bg-[var(--color-success)] text-white"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                  >
                    + Add
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-5 h-5 border-2 ${
                        newTagColor === color
                          ? 'border-[var(--color-border-dark)] scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tag list */}
              {tags.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                  No tags created yet.
                </p>
              ) : (
                <ul className="space-y-2" role="list" aria-label="Tags list">
                  {tags.map((tag) => (
                    <li
                      key={tag.id}
                      className="flex items-center justify-between p-2 border-2 border-[var(--color-border)] bg-[var(--color-editor-bg)]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 border-2 border-[var(--color-border-dark)]"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-bold">{tag.name}</span>
                      </div>
                      <button
                        className="retro-btn px-2 py-0.5 text-xs bg-[var(--color-error)] text-white"
                        onClick={() => onDeleteTag(tag.id)}
                        aria-label={`Delete tag: ${tag.name}`}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h3 className="text-sm font-bold uppercase mb-3 border-b-2 border-dashed border-[var(--color-border)] pb-2">
                Account & Sync
              </h3>

              {/* Connection status */}
              <div className="mb-4 p-3 bg-[var(--color-editor-bg)] border-2 border-[var(--color-border)] flex items-center gap-2">
                <div
                  className={`w-3 h-3 border-2 border-[var(--color-border-dark)] ${
                    isOnline ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)]'
                  }`}
                />
                <span className="text-sm">
                  {isOnline ? 'Connected to network' : 'Offline - changes saved locally'}
                </span>
              </div>

              {auth.isAuthenticated ? (
                <div>
                  <div className="p-3 bg-[var(--color-tag-bg)] border-2 border-[var(--color-border)] mb-4">
                    <p className="text-sm font-bold">✅ Signed in as:</p>
                    <p className="text-sm">{auth.username || auth.email}</p>
                    {auth.email && auth.username && (
                      <p className="text-xs text-[var(--color-text-muted)]">{auth.email}</p>
                    )}
                  </div>

                  {/* Sync controls */}
                  {onSyncRequest && (
                    <div className="mb-4">
                      <button
                        className={`retro-btn w-full px-4 py-2 text-sm text-white ${
                          syncStatus === 'syncing'
                            ? 'bg-[var(--color-text-muted)] cursor-wait'
                            : 'bg-[var(--color-accent)]'
                        }`}
                        onClick={handleSync}
                        disabled={syncStatus === 'syncing' || !isOnline}
                      >
                        {syncStatus === 'syncing' ? '🔄 Syncing...' : '🔄 Sync Now'}
                      </button>
                      {syncStatus === 'error' && (
                        <p className="text-xs text-[var(--color-error)] mt-1">
                          Sync failed. Try again later.
                        </p>
                      )}
                      {!isOnline && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Sync unavailable while offline.
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    className="retro-btn w-full px-4 py-2 bg-[var(--color-error)] text-white text-sm"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-4">
                    Sign in to sync your notes across devices. Your notes are always saved locally first.
                  </p>

                  {authError && (
                    <div className="p-2 mb-3 bg-[var(--color-error)]/10 border-2 border-[var(--color-error)] text-xs text-[var(--color-error)]">
                      {authError}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Username field - shown for register, also usable for login */}
                    {isRegistering && (
                      <input
                        type="text"
                        placeholder="Username (min 3 characters)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="retro-input w-full px-3 py-2 text-sm"
                        aria-label="Username"
                        minLength={3}
                        maxLength={100}
                      />
                    )}
                    <input
                      type="email"
                      placeholder={isRegistering ? 'Email address' : 'Email or username'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="retro-input w-full px-3 py-2 text-sm"
                      aria-label="Email address"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (isRegistering) {
                            handleRegister();
                          } else {
                            handleLogin();
                          }
                        }
                      }}
                      className="retro-input w-full px-3 py-2 text-sm"
                      aria-label="Password"
                    />
                    <div className="flex gap-2">
                      {isRegistering ? (
                        <>
                          <button
                            className="retro-btn flex-1 px-4 py-2 bg-[var(--color-secondary)] text-white text-sm"
                            onClick={handleRegister}
                            disabled={authLoading}
                          >
                            {authLoading ? '...' : 'Create Account'}
                          </button>
                          <button
                            className="retro-btn flex-1 px-4 py-2 bg-[var(--color-surface)] text-sm"
                            onClick={() => {
                              setIsRegistering(false);
                              setAuthError('');
                            }}
                            disabled={authLoading}
                          >
                            Back to Login
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="retro-btn flex-1 px-4 py-2 bg-[var(--color-accent)] text-white text-sm"
                            onClick={handleLogin}
                            disabled={authLoading}
                          >
                            {authLoading ? '...' : 'Sign In'}
                          </button>
                          <button
                            className="retro-btn flex-1 px-4 py-2 bg-[var(--color-secondary)] text-white text-sm"
                            onClick={() => {
                              setIsRegistering(true);
                              setAuthError('');
                            }}
                            disabled={authLoading}
                          >
                            Register
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-[10px] text-[var(--color-text-muted)] text-center border-t-2 border-dashed border-[var(--color-border)] pt-3">
                    Your notes are always stored locally. Account sync is optional.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
