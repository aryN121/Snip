import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function BarChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const shown = [...data].reverse().slice(0, 14);
  return (
    <div className="bar-chart">
      {shown.map((d) => (
        <div className="bar-chart-col" key={d.day}>
          <div
            className="bar"
            style={{ height: `${Math.max((d.count / max) * 100, 3)}%` }}
            title={`${d.count} clicks on ${d.day}`}
          ></div>
          <div className="bar-label">{d.day ? d.day.slice(5) : ''}</div>
        </div>
      ))}
    </div>
  );
}

export default function StatsModal({ code, onClose }) {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    setStats(null);
    setError(false);
    apiFetch(`/api/urls/${code}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setError(true));
  }, [code, apiFetch]);

  if (!code) return null;

  const shortUrl = stats ? `http://localhost:3000/${stats.shortCode}` : '';
  const created = stats ? new Date(stats.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const lastClick = stats?.last_clicked
    ? new Date(stats.last_clicked).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Never';

  return (
    <div
      className="modal-overlay show"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="stats-modal">
        <div className="modal-header">
          <h3 className="modal-title">Link Analytics</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {!stats && !error && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--accent2)' }}>Failed to load stats</div>
        )}

        {stats && (
          <>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">{stats.clicks}</div>
                <div className="stat-label">Total Clicks</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.clicksOverTime?.length || 0}</div>
                <div className="stat-label">Active Days</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ fontSize: 13, paddingTop: 7 }}>{lastClick}</div>
                <div className="stat-label">Last Click</div>
              </div>
            </div>

            <div className="modal-url-section">
              <div className="modal-url-label">Short URL</div>
              <div className="modal-url-val"><a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a></div>
            </div>
            <div className="modal-url-section">
              <div className="modal-url-label">Original URL</div>
              <div className="modal-url-val"><a href={stats.original} target="_blank" rel="noopener noreferrer">{stats.original}</a></div>
            </div>
            <div className="modal-url-section">
              <div className="modal-url-label">Created</div>
              <div className="modal-url-val">{created}</div>
            </div>

            {stats.clicksOverTime?.length > 0 && (
              <div>
                <div className="chart-title">Clicks — Last 30 Days</div>
                <BarChart data={stats.clicksOverTime} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
