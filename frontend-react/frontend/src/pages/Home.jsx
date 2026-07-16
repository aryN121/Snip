import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UrlsList from '../components/UrlsList';
import Footer from '../components/Footer'
export default function Home({ setView, onShowStats }) {
  const { currentUser, apiFetch, openAuthModal } = useAuth();
  const toast = useToast();

  const [url, setUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [hasRecent, setHasRecent] = useState(false);

  const preview = slug.trim() ? `${window.location.host}/${slug.trim()}` : '';

  const shorten = async () => {
    if (!currentUser) { openAuthModal('login'); return; }

    setError('');
    setResult(null);

    if (!url.trim()) { setError('Please enter a URL'); return; }

    setLoading(true);
    try {
      const r = await apiFetch('/api/shorten', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim(), customSlug: slug.trim() || undefined }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }

      setResult(d);
      setRefreshSignal((n) => n + 1);
      toast(d.reused ? '↩ Already shortened!' : '✓ Link created!');
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.shortUrl).then(() => toast('✓ Copied!'));
  };
  const openResult = () => {
    if (!result) return;
    window.open(result.shortUrl, '_blank');
  };

  return (
    <>
      <div className="hero">
        <p className="hero-eyebrow">// url shortener</p>
        <h1>Make it<br /><span>short.</span></h1>
        <p>Paste a long URL. Get a clean, shareable link instantly.</p>
      </div>

      <div className="shorten-card">
        <div className="form-row">
          <div className="input-wrap">
            <label className="input-label">Long URL</label>
            <input
              type="url"
              placeholder="https://example.com/very/long/path/..."
              value={url}
              disabled={!currentUser}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') shorten(); }}
            />
          </div>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn-shorten" disabled={loading} onClick={shorten}>
                {loading ? <span className="spinner"></span> : 'Shorten →'}
              </button>
            </div>
          )}
        </div>

        <div className="form-row two">
          <div className="input-wrap">
            <label className="input-label">Custom Slug (optional)</label>
            <input
              type="text"
              placeholder="my-cool-link"
              value={slug}
              disabled={!currentUser}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="input-wrap">
            <label className="input-label">Preview</label>
            <input type="text" readOnly placeholder="localhost:3000/..." value={preview} />
          </div>
        </div>

        {!currentUser && (
          <div className="login-gate">
            <p>Sign in to create and manage your short links.</p>
            <button onClick={() => openAuthModal('login')}>Sign In / Register →</button>
          </div>
        )}

        {error && <div className="error-box show">{error}</div>}

        {result && (
          <div className="result-box show">
            <span className="result-url">{result.shortUrl}</span>
            <div className="result-actions">
              <button className="btn-copy" onClick={copyResult}>Copy</button>
              <button className="btn-open" onClick={openResult}>Open ↗</button>
            </div>
          </div>
        )}
      </div>

      {currentUser && (
        <div style={{ display: hasRecent ? 'block' : 'none' }}>
          <div className="section-header">
            <h2 className="section-title">Recent Links</h2>
            <button className="nav-btn" onClick={() => setView('manage')}>View All →</button>
          </div>
          <UrlsList limit={5} refreshSignal={refreshSignal} onShowStats={onShowStats} onHasItems={setHasRecent} hideWhenEmpty />
        </div>
      )}
      <Footer/>
    </>
  );
}
