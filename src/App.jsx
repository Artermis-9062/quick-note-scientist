import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './index.css';

// Preprocessor for custom shortcut
const preprocessMarkdown = (text) => {
  // Replace /start, \start, /end, \end with $$
  let processed = text.replace(/[\/\\]start/g, '$$$$');
  processed = processed.replace(/[\/\\]end/g, '$$$$');
  return processed;
};

function App() {
  const [view, setView] = useState('home'); // 'home', 'editor', or 'notes'
  const [noteContent, setNoteContent] = useState('');
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);

  // Load notes from local storage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('scientist-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const handleCreateNote = () => {
    setView('editor');
    setNoteContent('');
    setActiveNoteId(null);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    let updatedNotes;
    if (activeNoteId) {
      // Update existing note
      updatedNotes = notes.map(n => 
        n.id === activeNoteId ? { ...n, content: noteContent, updatedAt: Date.now() } : n
      );
    } else {
      // Create new note
      const newNote = {
        id: Date.now().toString(),
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
    setNoteContent(note.content);
    setView('editor');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-placeholder"></div>
          <h2>Scientist</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className={`nav-item ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            <span className="icon">🏠</span>
            Home
          </a>
          <a href="#" className={`nav-item create-item ${view === 'editor' && !activeNoteId ? 'active' : ''}`} onClick={handleCreateNote}>
            <span className="icon">✨</span>
            Create +
          </a>
          <a href="#" className={`nav-item ${view === 'notes' ? 'active' : ''}`} onClick={() => setView('notes')}>
            <span className="icon">📝</span>
            My note
          </a>
          <div className="spacer"></div>
          <a href="#" className="nav-item delete-item">
            <span className="icon">🗑️</span>
            Delete
          </a>
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
            <div className="empty-state">
              <div className="empty-icon">🔬</div>
              <h3>No notes selected</h3>
              <p>Select a note from the sidebar or create a new one to start writing.</p>
              <button className="primary-button" onClick={handleCreateNote}>Create New Note</button>
            </div>
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
                    <div 
                      key={note.id} 
                      className="note-card"
                      onClick={() => handleOpenNote(note)}
                    >
                      <p className="note-preview">
                        {note.content.substring(0, 100)}{note.content.length > 100 ? '...' : ''}
                      </p>
                      <p className="note-date">
                        Saved: {new Date(note.updatedAt).toLocaleString()}
                      </p>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <button className="primary-button" onClick={handleSaveNote} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  💾 Save Note
                </button>
              </div>
              <textarea
                className="markdown-input"
                placeholder="Type your notes here... Use \start and \end for equations."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            </div>
            <div className="editor-pane preview-pane markdown-body">
              {noteContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {preprocessMarkdown(noteContent)}
                </ReactMarkdown>
              ) : (
                <div className="preview-placeholder">Live preview will appear here...</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
