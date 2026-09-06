import { useState }           from 'react';
import { useNavigate, Link }  from 'react-router-dom';
import { useAuth }            from '../context/AuthContext';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Both fields are required');
    setLoading(true); setError('');
    try {
      const { user } = await login(email, password);
      navigate(user.role === 'owner' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-shield">D</div>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Login to Deshmukh Travels</p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
          style={{ marginTop: '8px' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'var(--text-muted)' }}>
          New to Deshmukh Travels?{' '}
          <Link to="/register" style={{ color:'var(--orange)', fontWeight:'600' }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}