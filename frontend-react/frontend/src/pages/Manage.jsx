import { useEffect, useRef, useState } from 'react';
import UrlsList from '../components/UrlsList';

export default function Manage({ onShowStats }) {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">My Links</h2>
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <UrlsList query={query} onShowStats={onShowStats} />
    </div>
  );
}
