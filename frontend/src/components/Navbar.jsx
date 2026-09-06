// client/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-shield">D</div>
        <div className="navbar-logo-text">
          <span>DESHMUKH TRAVELS</span>
          <span>YOUR TRUSTED TRAVEL PARTNER</span>
        </div>
      </Link>

      <div className="navbar-links">
        {!user ? (
          <>
            <Link to="/login"    className="nav-link">Login</Link>
            <Link to="/register" className="btn-nav-primary">Register</Link>
          </>
        ) : (
          <>
            <span className="navbar-user">
              {user.name} · <strong>{user.role}</strong>
            </span>
            {user.role === 'owner' && (
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            )}
            {user.role === 'customer' && (
              <Link to="/bookings" className="nav-link">My Bookings</Link>
            )}
            <button onClick={handleLogout} className="btn-nav-ghost">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
