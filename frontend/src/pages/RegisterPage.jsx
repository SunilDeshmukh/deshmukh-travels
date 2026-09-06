import { useState }    from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';

export default function RegisterPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('customer');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const validate = () => {
    if (!name.trim())          return 'Name is required';
    if (!email.includes('@'))  return 'Enter a valid email';
    if (password.length < 6)   return 'Password must be at least 6 characters';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setLoading(true); setError('');
    try {
      const { user } = await register(name, email, password, role);
      navigate(user.role === 'owner' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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

        <h2 className="auth-title">Join Deshmukh Travels</h2>
        <p className="auth-subtitle">Create your account</p>

        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" placeholder="Sunil Deshmukh"
            value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="Min 6 characters"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        {/* Role selection */}
        <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--navy)', marginBottom:'10px' }}>
          I want to...
        </p>
        <div className="role-grid" style={{ marginBottom: '20px' }}>
          <div
            className={`role-card${role === 'customer' ? ' selected' : ''}`}
            onClick={() => setRole('customer')}
          >
            <div className="role-card-icon">🚗</div>
            <div className="role-card-title">Book a Cab</div>
            <div className="role-card-desc">I am a customer</div>
          </div>
          <div
            className={`role-card${role === 'owner' ? ' selected' : ''}`}
            onClick={() => setRole('owner')}
          >
            <div className="role-card-icon">🏢</div>
            <div className="role-card-title">List My Cabs</div>
            <div className="role-card-desc">I am an owner</div>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'14px', color:'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--orange)', fontWeight:'600' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}