import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ view, setView }) {
  const { currentUser, logout, openAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const chipRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (chipRef.current && !chipRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const initials = currentUser
    ? currentUser.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <header>
      <div className="logo" onClick={() => setView('home')}>
        <span className="logo-dot"></span> SNIP
      </div>
      <div className="header-right">
        <nav>
          <button className={`nav-btn ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>
            Shorten
          </button>
          <button className={`nav-btn ${view === 'manage' ? 'active' : ''}`} onClick={() => setView('manage')}>
            My Links
          </button>
        </nav>

        {!currentUser && (
          <button className="btn-login" onClick={() => openAuthModal('login')}>Sign In</button>
        )}

        {currentUser && (
          <div className="user-chip" ref={chipRef} onClick={() => setDropdownOpen((o) => !o)}>
            <div className="user-avatar">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt=""
                  onError={(e) => { e.target.replaceWith(document.createTextNode(initials)); }}
                />
              ) : (
                initials
              )}
            </div>
            <span className="user-name">{currentUser.name}</span>
            <div className={`dropdown ${dropdownOpen ? 'open' : ''}`}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                  {currentUser.email}
                </div>
              </div>
              <button className="dropdown-item" onClick={() => setView('manage')}>My Links</button>
              <hr className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={() => logout()}>Sign Out</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
