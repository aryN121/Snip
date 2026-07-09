import { useToast } from '../context/ToastContext';

export default function UrlCard({ url, onDeleted, onShowStats }) {
  const toast = useToast();
  const shortUrl = `${window.location.protocol}//${window.location.host}/${url.short_code}`;
  const date = new Date(url.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const copyLink = () => {
    navigator.clipboard.writeText(shortUrl).then(() => toast('✓ Copied!'));
  };

  return (
    <div className="url-card">
      <div className="url-card-left">
        <div className="url-card-short">{shortUrl}</div>
        <div className="url-card-original" title={url.original}>{url.original}</div>
        <div className="url-card-meta">
          <span>📊 {url.clicks} click{url.clicks !== 1 ? 's' : ''}</span>
          <span>📅 {date}</span>
        </div>
      </div>
      <div className="url-card-actions">
        <button className="btn-sm" onClick={copyLink}>Copy</button>
        <button className="btn-sm" onClick={() => onShowStats(url.short_code)}>Stats</button>
        <button className="btn-sm danger" onClick={() => onDeleted(url.short_code)}>Delete</button>
      </div>
    </div>
  );
}
