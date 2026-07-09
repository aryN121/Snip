import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import UrlCard from './UrlCard';

/**
 * Reusable list of short links.
 * - limit: cap the number shown (used for the "Recent Links" preview on Home)
 * - query: search string (used on the Manage page)
 * - refreshSignal: bump this number from the parent to force a reload
 *   (e.g. right after a new link is created)
 */
export default function UrlsList({ limit, query = '', refreshSignal, onShowStats, hideWhenEmpty = false, onHasItems, emptyIcon = '🔗', emptyTitle = 'No links yet', emptySub = 'Create your first short link above' }) {
  const { currentUser, apiFetch } = useAuth();
  const toast = useToast();
  const [urls, setUrls] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error | loaded
  const [removingCodes, setRemovingCodes] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setUrls([]);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    apiFetch(`/api/urls${q}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Request failed');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setUrls(data);
        setStatus('loaded');
        onHasItems?.(data.length > 0);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, query, refreshSignal, apiFetch]);

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete /${code}? This cannot be undone.`)) return;
    try {
      const r = await apiFetch(`/api/urls/${code}`, { method: 'DELETE' });
      if (!r.ok) { toast('Failed to delete', true); return; }
      setRemovingCodes((c) => [...c, code]);
      setTimeout(() => {
        setUrls((list) => list.filter((u) => u.short_code !== code));
        setRemovingCodes((c) => c.filter((x) => x !== code));
        toast('✓ Deleted');
      }, 200);
    } catch {
      toast('Error', true);
    }
  };

  if (!currentUser) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔐</div>
        <h3>Sign in to see your links</h3>
      </div>
    );
  }

  if (status === 'loading') {
    return <div style={{ color: 'var(--muted)', padding: 20, textAlign: 'center' }}>Loading...</div>;
  }

  if (status === 'error') {
    return (
      <div className="empty-state">
        <h3>Error loading links</h3>
        <p>Is the server running?</p>
      </div>
    );
  }

  if (!urls.length) {
    if (hideWhenEmpty) return null;
    return (
      <div className="empty-state">
        <div className="empty-icon">{query ? '🔍' : emptyIcon}</div>
        <h3>{query ? 'No results found' : emptyTitle}</h3>
        <p>{query ? 'Try a different search' : emptySub}</p>
      </div>
    );
  }

  const shown = limit ? urls.slice(0, limit) : urls;

  return (
    <div className="urls-list">
      {shown.map((u) => (
        <div
          key={u.short_code}
          style={removingCodes.includes(u.short_code) ? { opacity: 0, transition: 'opacity .2s' } : undefined}
        >
          <UrlCard url={u} onDeleted={handleDelete} onShowStats={onShowStats} />
        </div>
      ))}
    </div>
  );
}
