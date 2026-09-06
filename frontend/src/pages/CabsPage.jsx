// client/src/pages/CabsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import carImage from '../assets/animeCar.avif';

const CAB_TYPES = ['All', 'Sedan', 'SUV', 'Hatchback', 'Innova', 'Tempo'];

export default function CabsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cabs, setCabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/cabs')
      .then(res => setCabs(res.data))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'All'
    ? cabs
    : cabs.filter(c => c.type === filter);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <div>
            <p className="hero-tagline">Nashik · Maharashtra</p>
            <h1 className="hero-title">
              Your Trusted<br /><span>Travel Partner</span>
            </h1>
            <p className="hero-desc">
              Safe, comfortable cab rides across Maharashtra.
              Daily pickup &amp; drop from Nashik to Pune, Mumbai and beyond.
            </p>
            <div className="hero-badges">
              <span className="hero-badge">🛡️ Safe &amp; Comfortable</span>
              <span className="hero-badge">🕐 24×7 Booking</span>
              <span className="hero-badge">✅ Professional Drivers</span>
              <span className="hero-badge">⏱️ On-Time Service</span>
            </div>
            {!user && (
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
                style={{ width: 'auto', padding: '13px 32px', fontSize: '15px' }}
              >
                Book Your Cab →
              </button>
            )}
          </div>

          {/* Animated car */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="car-wrap">
              <img
                src={carImage}
                alt="Deshmukh Travels cab"
                style={{
                  width: '320px',
                  height: '180px',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Cab listings ───────────────────────────────────── */}
      <section className="cabs-section">
        <h2 className="section-heading">Available Cabs</h2>
        <p className="section-sub">
          {cabs.length} cab{cabs.length !== 1 ? 's' : ''} ready to book
        </p>

        {/* Filter chips */}
        <div className="filter-bar">
          {CAB_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`filter-chip${filter === type ? ' active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="page-loading">
            <div className="spinner" />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading cabs...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && displayed.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🚕</div>
            <div className="empty-state-title">No cabs found</div>
            <div className="empty-state-desc">Try a different filter</div>
          </div>
        )}

        {/* Grid */}
        <div className="cabs-grid">
          {displayed.map(cab => (
            <div
              key={cab.id}
              className="card card-clickable cab-card"
              onClick={() => navigate(`/cabs/${cab.id}`)}
            >
              {/* Image placeholder with orange gradient */}
              <div style={{
                height: '140px',
                background: `linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
              }}>
                {cab.imageUrl
                  ? <img src={cab.imageUrl} alt={cab.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🚗'
                }
              </div>

              <div className="cab-card-body">
                <div className="cab-card-name">{cab.name}</div>
                <div className="cab-card-meta">
                  {cab.type} · {cab.location} · {cab.capacity} seats
                </div>
                <div className="cab-card-price">
                  ₹{cab.pricePerKm}<span>/km</span>
                </div>
              </div>

              <div className="cab-card-footer">
                <span className={cab.isAvailable ? 'badge-available' : 'badge-unavailable'}>
                  {cab.isAvailable ? '● Available' : '○ Unavailable'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--orange)', fontWeight: '600' }}>
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
