import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function AuthModal() {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register, googleLogin } = useAuth();
  const toast = useToast();

  const [error, setError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  const switchTab = (tab) => {
    openAuthModal(tab);
    setError('');
  };

  const handleLogin = async () => {
    setError('');
    setLoginLoading(true);
    try {
      const user = await login(loginForm.email.trim(), loginForm.password);
      closeAuthModal();
      toast(`Welcome back, ${user.name}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setRegLoading(true);
    try {
      const user = await register(regForm.name.trim(), regForm.email.trim(), regForm.password);
      closeAuthModal();
      toast(`Welcome, ${user.name}! 🎉`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  if (!authModalOpen) return null;

  return (
    <div
      className={`modal-overlay ${authModalOpen ? 'show' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >
      <div className="modal-wrap">
        <div className="modal">
          <div className="modal-logo">🔗 SNIP</div>
          <p className="modal-sub">Your links. Your data.</p>

          <div className="modal-tabs">
            <button className={`modal-tab ${authModalTab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
              Sign In
            </button>
            <button className={`modal-tab ${authModalTab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
              Register
            </button>
          </div>

          {error && <div className="auth-error show">{error}</div>}

          {authModalTab === 'login' && (
            <div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                />
              </div>
              <button className="btn-primary" disabled={loginLoading} onClick={handleLogin}>
                {loginLoading ? <span className="spinner"></span> : 'Sign In'}
              </button>
              <div className="divider-or">or</div>
              <button className="btn-google" onClick={googleLogin}>
                <GoogleIcon />
                Continue with Google
              </button>
            </div>
          )}

          {authModalTab === 'register' && (
            <div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                />
              </div>
              <button className="btn-primary" disabled={regLoading} onClick={handleRegister}>
                {regLoading ? <span className="spinner"></span> : 'Create Account'}
              </button>
              <div className="divider-or">or</div>
              <button className="btn-google" onClick={googleLogin}>
                <GoogleIcon />
                Sign up with Google
              </button>
            </div>
          )}
        </div>
        <button className="modal-close-x" onClick={closeAuthModal}>×</button>
      </div>
    </div>
  );
}
