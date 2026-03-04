'use client';

/**
 * NoteEditor Component - Main editing area with markdown preview toggle.
 * Supports title editing, content editing with markdown, tag management, and autosave.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, Tag } from '@/types/note';

interface NoteEditorProps {
  /** The note being edited, or null if none selected */
  note: Note | null;
  /** All available tags */
  tags: Tag[];
  /** Callback when note content changes */
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  /** Callback to toggle a tag on the note */
  onToggleTag: (noteId: string, tagId: string) => void;
  /** Callback to create a new tag */
  onCreateTag: (name: string, color: string) => Tag;
  /** Callback to open sidebar on mobile */
  onOpenSidebar: () => void;
}

/** Predefined retro tag colors */
const TAG_COLORS = [
  '#d97706', '#dc2626', '#16a34a', '#2563eb',
  '#9333ea', '#db2777', '#0d9488', '#ca8a04',
];

// PUBLIC_INTERFACE
/**
 * NoteEditor provides the main editing interface for a note.
 * Includes title input, markdown editor with preview toggle,
 * tag management, and autosave status indicator.
 */
export default function NoteEditor({
  note,
  tags,
  onUpdateNote,
  onToggleTag,
  onCreateTag,
  onOpenSidebar,
}: NoteEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Show autosave indicator
  useEffect(() => {
    if (note) {
      setSaveStatus('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saved');
      }, 1200);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [note?.title, note?.content, note?.tags, note]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && !isPreview) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [note?.content, isPreview]);

  /** Get tags attached to the current note */
  const getNoteTags = (): Tag[] => {
    if (!note) return [];
    return note.tags
      .map((id) => tags.find((t) => t.id === id))
      .filter((t): t is Tag => t !== undefined);
  };

  /** Handle creating a new tag */
  const handleCreateTag = () => {
    if (!newTagName.trim() || !note) return;
    const tag = onCreateTag(newTagName.trim(), newTagColor);
    onToggleTag(note.id, tag.id);
    setNewTagName('');
    setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
  };

  // Empty state when no note is selected
  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--color-background)] p-8">
        <button
          className="lg:hidden retro-btn px-4 py-2 bg-[var(--color-accent)] text-white mb-6"
          onClick={onOpenSidebar}
        >
          ☰ Open Notes
        </button>
        <div className="text-center retro-card p-8 max-w-md">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">No Note Selected</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Select a note from the sidebar or create a new one to get started.
          </p>
          <div className="mt-4 text-xs text-[var(--color-text-muted)] border-t-2 border-dashed border-[var(--color-border)] pt-4">
            <p>💡 Tip: Use <code className="bg-[var(--color-tag-bg)] px-1">**bold**</code> and <code className="bg-[var(--color-tag-bg)] px-1">*italic*</code> for markdown</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-background)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b-[3px] border-[var(--color-border-dark)] bg-[var(--color-surface)] flex-wrap">
        {/* Mobile menu button */}
        <button
          className="lg:hidden retro-btn px-2 py-1 bg-[var(--color-surface)] text-sm"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          ☰
        </button>

        {/* Edit/Preview toggle */}
        <div className="flex border-[3px] border-[var(--color-border-dark)]">
          <button
            className={`px-3 py-1 text-xs font-bold uppercase ${
              !isPreview
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
            }`}
            onClick={() => setIsPreview(false)}
          >
            ✏️ Edit
          </button>
          <button
            className={`px-3 py-1 text-xs font-bold uppercase border-l-[3px] border-[var(--color-border-dark)] ${
              isPreview
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]'
            }`}
            onClick={() => setIsPreview(true)}
          >
            👁️ Preview
          </button>
        </div>

        {/* Tag management */}
        <div className="relative">
          <button
            className="retro-btn px-2 py-1 text-xs bg-[var(--color-tag-bg)] text-[var(--color-tag-text)]"
            onClick={() => setShowTagMenu(!showTagMenu)}
            aria-expanded={showTagMenu}
          >
            🏷️ Tags ({note.tags.length})
          </button>

          {showTagMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 retro-card p-3 z-50">
              <div className="text-xs font-bold uppercase mb-2 border-b-2 border-dashed border-[var(--color-border)] pb-1">
                Manage Tags
              </div>
              {/* Existing tags */}
              <div className="max-h-32 overflow-y-auto mb-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[var(--color-surface-hover)] px-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={note.tags.includes(tag.id)}
                      onChange={() => onToggleTag(note.id, tag.id)}
                      className="w-4 h-4 accent-[var(--color-accent)]"
                    />
                    <span
                      className="w-3 h-3 border border-[var(--color-border-dark)]"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
              {/* Create new tag */}
              <div className="border-t-2 border-dashed border-[var(--color-border)] pt-2">
                <div className="flex gap-1 mb-1">
                  <input
                    type="text"
                    placeholder="New tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    className="retro-input flex-1 px-2 py-1 text-xs"
                    maxLength={20}
                  />
                  <button
                    className="retro-btn px-2 py-1 text-xs bg-[var(--color-success)] text-white"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-4 h-4 border-2 ${
                        newTagColor === color
                          ? 'border-[var(--color-border-dark)] scale-125'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current tags */}
        <div className="flex gap-1 flex-wrap flex-1">
          {getNoteTags().map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 text-[10px] font-bold border-2"
              style={{
                backgroundColor: tag.color + '30',
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Autosave status */}
        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
          {saveStatus === 'saving' && <span>💾 Saving...</span>}
          {saveStatus === 'saved' && <span>✅ Saved</span>}
        </div>
      </div>

      {/* Title input */}
      <div className="px-6 pt-4">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, { title: e.target.value })}
          placeholder="Note title..."
          className="w-full bg-transparent text-2xl font-bold outline-none border-b-2 border-dashed border-[var(--color-border)] pb-2 placeholder:text-[var(--color-text-muted)]"
          aria-label="Note title"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isPreview ? (
          <div className="markdown-content" role="document" aria-label="Markdown preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.content || '*No content yet...*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={note.content}
            onChange={(e) => onUpdateNote(note.id, { content: e.target.value })}
            placeholder="Start writing your note... (Markdown supported)"
            className="w-full min-h-[60vh] bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:text-[var(--color-text-muted)]"
            aria-label="Note content editor"
            spellCheck
          />
        )}
      </div>

      {/* Bottom status bar */}
      <div className="px-6 py-2 border-t-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] text-[var(--color-text-muted)] flex justify-between">
        <span>
          Created: {new Date(note.createdAt).toLocaleString()} | Updated: {new Date(note.updatedAt).toLocaleString()}
        </span>
        <span>{note.content.length} chars | {note.content.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  );
}
