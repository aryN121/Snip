import { useToast } from '../context/ToastContext';

export default function UrlCard({ url, onDeleted, onShowStats }) {
  const toast = useToast();
  // const shortUrl = `${window.location.protocol}//${window.location.host}/${url.shortCode}`;
  const shortUrl = `http://localhost:3000/${url.shortCode}`;
  const date = new Date(url.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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
        <button className="btn-sm" onClick={() => onShowStats(url.shortCode)}>Stats</button>
        <button className="btn-sm danger" onClick={() => onDeleted(url.shortCode)}>Delete</button>
      </div>
    </div>
  );
}
