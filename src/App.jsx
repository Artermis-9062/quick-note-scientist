import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './index.css';
import { translateMath, toLatex, mapCaret } from './utils/mathTranslator.js';

// Preprocessor for custom shortcut
const preprocessMarkdown = (text) => {
  // Replace /start, \start, /end, \end with $$
  let processed = text.replace(/[\/\\]start/g, '$$$$');
  processed = processed.replace(/[\/\\]end/g, '$$$$');
  return processed;
};

// Time-ago helper — converts a timestamp to a human-readable relative time
const timeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? 's' : ''} ago`;
};

// Time-remaining helper — converts remaining ms to human-readable countdown
const timeRemaining = (remainingMs) => {
  if (remainingMs <= 0) return 'any moment now';

  const seconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `in ${days} day${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  if (minutes > 0) return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  return 'in less than a minute';
};

// Auto-purge duration options
const PURGE_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'After 1 day' },
  { value: 7, label: 'After 7 days' },
  { value: 14, label: 'After 14 days' },
  { value: 30, label: 'After 30 days' },
  { value: 60, label: 'After 60 days' },
  { value: 90, label: 'After 90 days' },
];

const DEFAULT_SETTINGS = {
  autoPurgeDays: 30,
};

function App() {
  const [view, setView] = useState('home'); // 'home', 'editor', 'notes', 'deleted', or 'settings'
  const [noteTitle, setNoteTitle] = useState('');
  const editorRef = useRef(null);
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load notes and settings from local storage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('scientist-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    const savedDeleted = localStorage.getItem('scientist-deleted-notes');
    if (savedDeleted) {
      setDeletedNotes(JSON.parse(savedDeleted));
    }
    const savedSettings = localStorage.getItem('scientist-settings');
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    }
  }, []);

  // Auto-purge expired deleted notes
  useEffect(() => {
    if (settings.autoPurgeDays === 0 || deletedNotes.length === 0) return;

    const purgeThreshold = settings.autoPurgeDays * 86400000; // days to ms
    const now = Date.now();
    const remaining = deletedNotes.filter(
      (note) => now - note.deletedAt < purgeThreshold
    );

    if (remaining.length < deletedNotes.length) {
      setDeletedNotes(remaining);
      localStorage.setItem('scientist-deleted-notes', JSON.stringify(remaining));
    }
  }, [deletedNotes, settings.autoPurgeDays]);

  // Caret tracking across in-place translations from the symbol translator.
  // `pendingCaret` holds the caret offset in the *original* (pre-translation)
  // string; the layout effect below maps it to the new offset and applies it.
  const pendingCaretRef = useRef(null);
  useLayoutEffect(() => {
    if (pendingCaretRef.current == null) return;
    const ta = editorRef.current;
    if (!ta) return;
    const { original, caret } = pendingCaretRef.current;
    const mapped = mapCaret(original, noteContent, caret);
    ta.setSelectionRange(mapped, mapped);
    pendingCaretRef.current = null;
  }, [noteContent]);

  const handleContentChange = (e) => {
    const next = e.target.value;
    const caret = e.target.selectionStart ?? next.length;
    const translated = translateMath(next);
    pendingCaretRef.current = { original: next, caret };
    setNoteContent(translated);
  };

  // --- Settings Handlers ---

  const handleSettingsChange = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('scientist-settings', JSON.stringify(updated));
  };

  const handleClearAllTrash = () => {
    if (!window.confirm('Are you sure you want to permanently delete all trashed notes? This cannot be undone.')) {
      return;
    }
    setDeletedNotes([]);
    localStorage.setItem('scientist-deleted-notes', JSON.stringify([]));
  };

  // --- Note Handlers ---

  const handleCreateNote = () => {
    setView('editor');
    setNoteTitle('');
    setNoteContent('');
    setActiveNoteId(null);
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const titleToSave = noteTitle.trim() || 'Untitled Note';
    let updatedNotes;
    if (activeNoteId) {
      // Update existing note
      updatedNotes = notes.map(n => 
        n.id === activeNoteId ? { ...n, title: titleToSave, content: noteContent, updatedAt: Date.now() } : n
      );
    } else {
      // Create new note
      const newNote = {
        id: Date.now().toString(),
        title: titleToSave,
        content: noteContent,
        updatedAt: Date.now()
      };
      updatedNotes = [...notes, newNote];
      setActiveNoteId(newNote.id);
    }

    setNotes(updatedNotes);
    localStorage.setItem('scientist-notes', JSON.stringify(updatedNotes));
    alert('Note saved to your storage!');
  };

  const handleOpenNote = (note) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title || '');
    setNoteContent(note.content);
    setView('editor');
  };

  // --- Delete Handlers ---

  const handleDeleteNote = (noteId) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    // Remove from active notes
    const updatedNotes = notes.filter(n => n.id !== noteId);
    setNotes(updatedNotes);
    localStorage.setItem('scientist-notes', JSON.stringify(updatedNotes));

    // Add to deleted notes with a deletedAt timestamp
    const deletedNote = { ...noteToDelete, deletedAt: Date.now() };
    const updatedDeleted = [...deletedNotes, deletedNote];
    setDeletedNotes(updatedDeleted);
    localStorage.setItem('scientist-deleted-notes', JSON.stringify(updatedDeleted));

    // If this note was open in the editor, go back home
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      setView('home');
    }
  };

  const handleRestoreNote = (noteId) => {
    const noteToRestore = deletedNotes.find(n => n.id === noteId);
    if (!noteToRestore) return;

    // Remove from deleted
    const updatedDeleted = deletedNotes.filter(n => n.id !== noteId);
    setDeletedNotes(updatedDeleted);
    localStorage.setItem('scientist-deleted-notes', JSON.stringify(updatedDeleted));

    // Add back to active notes (remove deletedAt property)
    const { deletedAt, ...restoredNote } = noteToRestore;
    const updatedNotes = [...notes, restoredNote];
    setNotes(updatedNotes);
    localStorage.setItem('scientist-notes', JSON.stringify(updatedNotes));
  };

  const handlePermanentDelete = (noteId) => {
    const updatedDeleted = deletedNotes.filter(n => n.id !== noteId);
    setDeletedNotes(updatedDeleted);
    localStorage.setItem('scientist-deleted-notes', JSON.stringify(updatedDeleted));
  };

  // --- Countdown Helper ---
  const getCountdownInfo = (deletedAt) => {
    if (settings.autoPurgeDays === 0) {
      return { text: 'Kept forever', expiringSoon: false };
    }
    const expiresAt = deletedAt + settings.autoPurgeDays * 86400000;
    const remainingMs = expiresAt - Date.now();
    const expiringSoon = remainingMs < 86400000; // less than 1 day
    return {
      text: `Auto-deletes ${timeRemaining(remainingMs)}`,
      expiringSoon,
    };
  };

  // --- Current purge label ---
  const currentPurgeLabel = PURGE_OPTIONS.find(o => o.value === settings.autoPurgeDays)?.label || `After ${settings.autoPurgeDays} days`;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h2>Scientist</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item create-item ${view === 'editor' && !activeNoteId ? 'active' : ''}`} onClick={handleCreateNote}>
            <span className="icon">✨</span>
            Create +
          </a>
          <a href="#" className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            <span className="icon">🏠</span>
            Home
          </a>
          <a href="#" className={`nav-item ${view === 'notes' ? 'active' : ''}`} onClick={() => setView('notes')}>
            <span className="icon">📝</span>
            My note
          </a>
          <a href="#" className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
            <span className="icon">⚙️</span>
            Settings
          </a>
          <div className="spacer"></div>
          <div className="nav-item-wrapper">
            <a href="#" className={`nav-item delete-item ${view === 'deleted' ? 'active' : ''}`} onClick={() => setView('deleted')} style={{ width: '100%' }}>
              <span className="icon">🗑️</span>
              Deleted
            </a>
            {deletedNotes.length > 0 && (
              <span className="delete-badge">{deletedNotes.length}</span>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <h1>Notes for Scientist</h1>
          <p className="subtitle">Your dedicated space for research and discovery.</p>
        </header>
        
        {view === 'home' && (
          <div className="content-area">
            {notes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <h3>No notes yet</h3>
                <p>Create your first note to start capturing ideas and equations.</p>
                <button className="primary-button" onClick={handleCreateNote}>Create New Note</button>
              </div>
            ) : (
              <div className="notes-list">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ color: 'white' }}>Recently Edited</h2>
                  <button className="primary-button" onClick={handleCreateNote} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    ✨ New Note
                  </button>
                </div>
                <div className="notes-grid">
                  {[...notes]
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 5)
                    .map(note => (
                      <div
                        key={note.id}
                        className="note-card"
                        onClick={() => handleOpenNote(note)}
                      >
                        <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
                        <p className="note-preview">
                          {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                        </p>
                        <p className="note-date">
                          Edited {timeAgo(note.updatedAt)}
                        </p>
                      </div>
                    ))
                  }
                </div>
                {notes.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                      className="primary-button"
                      onClick={() => setView('notes')}
                      style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--border-color)', boxShadow: 'none' }}
                    >
                      View all {notes.length} notes →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'notes' && (
          <div className="content-area">
            <div className="notes-list">
              <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>My Notes</h2>
              {notes.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>You haven't saved any notes yet.</p>
              ) : (
                <div className="notes-grid">
                  {notes.map(note => (
                    <div key={note.id} className="note-card-wrapper">
                      <div className="note-card-delete">
                        <button
                          className="delete-icon-button"
                          title="Delete note"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                      <div 
                        className="note-card"
                        onClick={() => handleOpenNote(note)}
                      >
                        <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
                        <p className="note-preview">
                          {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                        </p>
                        <p className="note-date">
                          Saved: {new Date(note.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'editor' && (
          <div className="editor-area">
            <div className="editor-pane input-pane" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="note-title-input"
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editorRef.current?.focus(); } }}
                  style={{ flex: 1, marginBottom: 0 }}
                />
                {activeNoteId && (
                  <button
                    className="delete-icon-button"
                    title="Delete this note"
                    onClick={() => handleDeleteNote(activeNoteId)}
                    style={{ padding: '0.5rem 0.6rem', fontSize: '1.1rem' }}
                  >
                    🗑️
                  </button>
                )}
                <button className="primary-button" onClick={handleSaveNote} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  💾 Save Note
                </button>
              </div>
              <textarea
                ref={editorRef}
                className="markdown-input"
                placeholder="Type your notes here... Use \start and \end for equations."
                value={noteContent}
                onChange={handleContentChange}
              />
            </div>
            <div className="editor-pane preview-pane markdown-body">
              {noteTitle && <h1 className="preview-title">{noteTitle}</h1>}
              {noteContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {toLatex(preprocessMarkdown(noteContent))}
                </ReactMarkdown>
              ) : (
                !noteTitle && <div className="preview-placeholder">Live preview will appear here...</div>
              )}
            </div>
          </div>
        )}

        {view === 'deleted' && (
          <div className="content-area">
            <div className="notes-list">
              <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Deleted Notes</h2>
              {deletedNotes.length === 0 ? (
                <div className="deleted-empty-state">
                  <div className="empty-icon">🗑️</div>
                  <h3>Trash is empty</h3>
                  <p>Notes you delete will appear here. You can restore or permanently remove them.</p>
                </div>
              ) : (
                <div className="notes-grid">
                  {deletedNotes.map(note => {
                    const countdown = getCountdownInfo(note.deletedAt);
                    return (
                      <div key={note.id} className="deleted-note-card">
                        <h3 className="note-card-title">{note.title || 'Untitled Note'}</h3>
                        <p className="deleted-note-preview">
                          {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                        </p>
                        <div className="deleted-time">
                          <span className="time-icon">🕐</span>
                          Deleted {timeAgo(note.deletedAt)}
                        </div>
                        <div className={`auto-delete-countdown ${countdown.expiringSoon ? 'expiring-soon' : ''}`}>
                          ⏳ {countdown.text}
                        </div>
                        <div className="deleted-note-actions">
                          <button
                            className="restore-button"
                            onClick={() => handleRestoreNote(note.id)}
                          >
                            ↩ Restore
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => handlePermanentDelete(note.id)}
                          >
                            ✕ Delete Forever
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="settings-page">
            {/* Trash & Auto-Delete Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">
                <span className="section-icon">🗑️</span>
                Trash & Auto-Delete
              </h3>
              <p className="settings-description">
                Configure how long deleted notes remain in the trash before being permanently removed. 
                Once auto-deleted, notes cannot be recovered.
              </p>

              <div className="settings-info-card">
                <span className="settings-info-icon">
                  {settings.autoPurgeDays === 0 ? '♾️' : '⏱️'}
                </span>
                <span className="settings-info-text">
                  {settings.autoPurgeDays === 0 ? (
                    <>Deleted notes are <strong>kept forever</strong> until you manually remove them.</>
                  ) : (
                    <>Deleted notes are automatically removed after <strong>{currentPurgeLabel.replace('After ', '')}</strong>.</>
                  )}
                </span>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-label">Auto-delete after</div>
                  <div className="settings-sublabel">Choose how long to keep deleted notes</div>
                </div>
                <select
                  className="settings-select"
                  value={settings.autoPurgeDays}
                  onChange={(e) => handleSettingsChange('autoPurgeDays', Number(e.target.value))}
                >
                  {PURGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="settings-divider"></div>

              <div className="settings-row">
                <div>
                  <div className="settings-label">Clear all trash</div>
                  <div className="settings-sublabel">
                    Permanently delete all {deletedNotes.length} note{deletedNotes.length !== 1 ? 's' : ''} in trash
                  </div>
                </div>
                <button
                  className="clear-all-button"
                  onClick={handleClearAllTrash}
                  disabled={deletedNotes.length === 0}
                >
                  ⚠️ Clear All Trash
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
