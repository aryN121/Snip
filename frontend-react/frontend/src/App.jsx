import { useState } from 'react';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import StatsModal from './components/StatsModal';
import Home from './pages/Home';
import Manage from './pages/Manage';


export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'manage'
  const [statsCode, setStatsCode] = useState(null);

  return (
    <div className="container">
      <Header view={view} setView={setView} />

      {view === 'home' && <Home setView={setView} onShowStats={setStatsCode} />}
      {view === 'manage' && <Manage onShowStats={setStatsCode} />}

      <AuthModal />
      <StatsModal code={statsCode} onClose={() => setStatsCode(null)} />
        
    </div>
  );
}
