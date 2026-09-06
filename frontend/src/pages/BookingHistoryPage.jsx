import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_STYLE = {
  pending:   'status-pending',
  confirmed: 'status-confirmed',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
  });

export default function BookingHistoryPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    if (!user)                    return navigate('/login');
    if (user.role !== 'customer') return navigate('/');
    api.get('/bookings/my')
      .then(res  => setBookings(res.data))
      .catch(()  => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status:'cancelled' } : b));
    } catch (err) { alert(err.response?.data?.error || 'Failed to cancel'); }
  };

  const displayed = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>Loading your bookings...</p>
    </div>
  );

  return (
    <>
      <div className="dashboard-header">
        <div style={{ maxWidth:'700px', margin:'0 auto' }}>
          <h2>My Bookings</h2>
          <p>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'32px 20px' }}>

        {/* Filter chips */}
        <div className="filter-bar">
          {['all','pending','confirmed','completed','cancelled'].map(s => (
            <button key={s}
              onClick={() => setFilter(s)}
              className={`filter-chip${filter === s ? ' active' : ''}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Empty */}
        {displayed.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🗒️</div>
            <div className="empty-state-title">
              {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
            </div>
            {filter === 'all' && (
              <button onClick={() => navigate('/')}
                className="btn-primary"
                style={{ width:'auto', padding:'10px 24px', marginTop:'16px', fontSize:'14px' }}>
                Browse Cabs →
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {displayed.map(booking => (
          <div key={booking.id} className="booking-card">
            <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'flex-start', marginBottom:'10px' }}>
              <div>
                <div className="booking-route">
                  {booking.fromLocation} → {booking.toLocation}
                </div>
                <div className="booking-dates">
                  {formatDate(booking.journeyDate)} → {formatDate(booking.returnDate)}
                </div>
              </div>
              <span className={`status-badge ${STATUS_STYLE[booking.status]}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            {booking.cab && (
              <div style={{ fontSize:'13px', color:'var(--text-muted)',
                            background:'var(--bg)', padding:'8px 12px',
                            borderRadius:'var(--radius-sm)', marginBottom:'10px' }}>
                🚗 {booking.cab.name} · {booking.cab.type}
                {booking.totalPrice && ` · ₹${booking.totalPrice}`}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <button onClick={() => navigate(`/cabs/${booking.cabId}`)}
                style={{ fontSize:'13px', color:'var(--orange)', background:'none',
                         border:'none', cursor:'pointer', fontWeight:'600', padding:0 }}>
                View cab →
              </button>
              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                <button onClick={() => handleCancel(booking.id)}
                  className="btn-danger" style={{ padding:'4px 12px' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}