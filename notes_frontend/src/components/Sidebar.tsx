'use client';

/**
 * Sidebar Component - Displays the note list, tag filters, and search bar.
 * Features retro-themed styling with pixel borders and monospace fonts.
 */

import React, { useState } from 'react';
import { Note, Tag, NoteFilter } from '@/types/note';

interface SidebarProps {
  /** Filtered list of notes to display */
  notes: Note[];
  /** All available tags */
  tags: Tag[];
  /** Currently active note ID */
  activeNoteId: string | null;
  /** Current filter state */
  filter: NoteFilter;
  /** Whether the app is online */
  isOnline: boolean;
  /** Callback when a note is selected */
  onSelectNote: (id: string) => void;
  /** Callback when filter changes */
  onFilterChange: (filter: NoteFilter) => void;
  /** Callback to create a new note */
  onCreateNote: () => void;
  /** Callback to delete a note */
  onDeleteNote: (id: string) => void;
  /** Callback when settings is clicked */
  onOpenSettings: () => void;
  /** Whether sidebar is open (mobile) */
  isOpen: boolean;
  /** Callback to close sidebar (mobile) */
  onClose: () => void;
}

// PUBLIC_INTERFACE
/**
 * Sidebar component showing note list, search, tag filters, and navigation.
 * Responsive: slides in on mobile, always visible on desktop.
 */
export default function Sidebar({
  notes,
  tags,
  activeNoteId,
  filter,
  isOnline,
  onSelectNote,
  onFilterChange,
  onCreateNote,
  onDeleteNote,
  onOpenSettings,
  isOpen,
  onClose,
}: SidebarProps) {
  const [showTagFilter, setShowTagFilter] = useState(false);

  /** Format date for display in note list */
  const formatDate = (iso: string): string => {
    const date = new Date(iso);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  /** Get tag objects for a note */
  const getNoteTags = (tagIds: string[]): Tag[] => {
    return tagIds
      .map((id) => tags.find((t) => t.id === id))
      .filter((t): t is Tag => t !== undefined);
  };

  /** Toggle a tag in the filter */
  const toggleTagFilter = (tagId: string) => {
    const isSelected = filter.selectedTags.includes(tagId);
    onFilterChange({
      ...filter,
      selectedTags: isSelected
        ? filter.selectedTags.filter((id) => id !== tagId)
        : [...filter.selectedTags, tagId],
    });
  };

  /** Get a preview of the note content */
  const getPreview = (content: string): string => {
    const stripped = content.replace(/[#*_~`>\-\[\]()!]/g, '').trim();
    return stripped.length > 60 ? stripped.slice(0, 60) + '...' : stripped || 'Empty note...';
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-80 flex flex-col
          bg-[var(--color-sidebar-bg)]
          border-r-[3px] border-[var(--color-border-dark)]
          transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        role="navigation"
        aria-label="Notes sidebar"
      >
        {/* Header */}
        <div className="p-4 border-b-[3px] border-[var(--color-border-dark)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold tracking-wider uppercase flex items-center gap-2">
              <span className="text-2xl">📝</span> NoteMaster
            </h1>
            <div className="flex items-center gap-2">
              {/* Online/Offline indicator */}
              <div
                className={`w-3 h-3 border-2 border-[var(--color-border-dark)] ${
                  isOnline ? 'bg-[var(--color-success)]' : 'bg-[var(--color-error)] pulse-offline'
                }`}
                title={isOnline ? 'Online' : 'Offline'}
                role="status"
                aria-label={isOnline ? 'Online' : 'Offline mode'}
              />
              {/* Close button (mobile) */}
              <button
                className="lg:hidden retro-btn px-2 py-1 bg-[var(--color-surface)] text-sm"
                onClick={onClose}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>
          </div>

          {/* New Note button */}
          <button
            className="retro-btn w-full py-2 mb-3 bg-[var(--color-accent)] text-white text-sm uppercase tracking-wide"
            onClick={() => {
              onCreateNote();
              onClose();
            }}
          >
            ✚ New Note
          </button>

          {/* Search bar */}
          <input
            type="text"
            placeholder="🔍 Search notes..."
            value={filter.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filter, searchQuery: e.target.value })
            }
            className="retro-input w-full px-3 py-2 text-sm"
            aria-label="Search notes"
          />

          {/* Tag filter toggle */}
          <div className="mt-2 flex items-center gap-2">
            <button
              className="retro-btn px-2 py-1 text-xs bg-[var(--color-tag-bg)] text-[var(--color-tag-text)]"
              onClick={() => setShowTagFilter(!showTagFilter)}
              aria-expanded={showTagFilter}
              aria-controls="tag-filter-panel"
            >
              🏷️ Tags {filter.selectedTags.length > 0 && `(${filter.selectedTags.length})`}
            </button>
            {filter.selectedTags.length > 0 && (
              <button
                className="text-xs underline text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                onClick={() => onFilterChange({ ...filter, selectedTags: [] })}
              >
                Clear
              </button>
            )}
            <button
              className="ml-auto retro-btn px-2 py-1 text-xs bg-[var(--color-surface)]"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              ⚙️
            </button>
          </div>

          {/* Tag filter panel */}
          {showTagFilter && (
            <div
              id="tag-filter-panel"
              className="mt-2 flex flex-wrap gap-1 p-2 bg-[var(--color-editor-bg)] border-2 border-[var(--color-border)]"
            >
              {tags.length === 0 ? (
                <span className="text-xs text-[var(--color-text-muted)]">No tags yet</span>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    className={`px-2 py-0.5 text-xs font-bold border-2 cursor-pointer transition-all ${
                      filter.selectedTags.includes(tag.id)
                        ? 'border-[var(--color-border-dark)] shadow-[var(--shadow-retro-sm)]'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: tag.color + '40', color: tag.color }}
                    onClick={() => toggleTagFilter(tag.id)}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">
                {filter.searchQuery || filter.selectedTags.length > 0
                  ? 'No notes match your filters'
                  : 'No notes yet. Create one!'}
              </p>
            </div>
          ) : (
            <ul role="list" aria-label="Notes list">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    className={`w-full text-left p-3 border-b-2 border-[var(--color-border)] transition-colors ${
                      activeNoteId === note.id
                        ? 'bg-[var(--color-accent)]/20 border-l-4 border-l-[var(--color-accent)]'
                        : 'hover:bg-[var(--color-surface-hover)]'
                    }`}
                    onClick={() => {
                      onSelectNote(note.id);
                      onClose();
                    }}
                    aria-current={activeNoteId === note.id ? 'true' : undefined}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm truncate pr-2">
                        {note.title || 'Untitled'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!note.synced && (
                          <span className="text-[10px] text-[var(--color-text-muted)]" title="Not synced">
                            ●
                          </span>
                        )}
                        <button
                          className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)]/80 px-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                          }}
                          aria-label={`Delete note: ${note.title}`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1 truncate">
                      {getPreview(note.content)}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatDate(note.updatedAt)}
                      </span>
                      {getNoteTags(note.tags).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[10px] px-1 font-bold border border-current"
                          style={{ color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with stats */}
        <div className="p-3 border-t-[3px] border-[var(--color-border-dark)] bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)]">
          <div className="flex justify-between">
            <span>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            <span>{isOnline ? '🟢 Online' : '🔴 Offline'}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
