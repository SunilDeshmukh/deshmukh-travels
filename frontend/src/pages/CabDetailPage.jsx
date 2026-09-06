// client/src/pages/CabDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CabDetailPage() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cab,         setCab]         = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [booking,     setBooking]     = useState({ fromLocation:'', toLocation:'', journeyDate:'', returnDate:'' });
  const [submitting,  setSubmitting]  = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    api.get(`/cabs/${id}`)
      .then(res  => setCab(res.data))
      .catch(()  => setError('Cab not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user)                    return navigate('/login');
    if (user.role !== 'customer') return setError('Only customers can book cabs');
    if (!booking.fromLocation || !booking.toLocation || !booking.journeyDate || !booking.returnDate)
      return setError('All booking fields are required');
    if (new Date(booking.returnDate) <= new Date(booking.journeyDate))
      return setError('Return date must be after journey date');

    setSubmitting(true); setError('');
    try {
      await api.post('/bookings', {
        fromLocation: booking.fromLocation,
        toLocation:   booking.toLocation,
        journeyDate:  new Date(booking.journeyDate).toISOString(),
        returnDate:   new Date(booking.returnDate).toISOString(),
        cabId:        cab.id,
        customerId:   user.id,
      });
      setBookingDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>Loading cab details...</p>
    </div>
  );

  if (error && !cab) return (
    <div className="page-loading">
      <div style={{ fontSize:'48px' }}>🚫</div>
      <p style={{ color:'var(--text-muted)' }}>{error}</p>
    </div>
  );

  return (
    <div style={{ maxWidth:'780px', margin:'0 auto', padding:'32px 20px' }}>

      {/* Back */}
      <button onClick={() => navigate('/')}
        style={{ background:'none', border:'none', color:'var(--orange)',
                 cursor:'pointer', fontSize:'14px', fontWeight:'600',
                 marginBottom:'20px', padding:0 }}>
        ← Back to all cabs
      </button>

      {/* Cab hero */}
      <div className="card" style={{ marginBottom:'20px', overflow:'hidden' }}>
        <div style={{ height:'200px', background:'linear-gradient(135deg, var(--navy), var(--navy-light))',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:'72px' }}>
          {cab.imageUrl
            ? <img src={cab.imageUrl} alt={cab.name}
                style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : '🚗'
          }
        </div>
        <div style={{ padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <h2 style={{ fontFamily:'Poppins', fontSize:'26px',
                           fontWeight:'800', color:'var(--navy)', marginBottom:'6px' }}>
                {cab.name}
              </h2>
              <p style={{ fontSize:'14px', color:'var(--text-muted)' }}>
                {cab.type} · {cab.location} · {cab.capacity} seats
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'Poppins', fontSize:'28px',
                            fontWeight:'800', color:'var(--orange)' }}>
                ₹{cab.pricePerKm}
                <span style={{ fontSize:'14px', fontWeight:'400', color:'var(--text-muted)' }}>/km</span>
              </div>
              <span className={cab.isAvailable ? 'badge-available' : 'badge-unavailable'}
                style={{ marginTop:'6px', display:'inline-block' }}>
                {cab.isAvailable ? '● Available' : '○ Unavailable'}
              </span>
            </div>
          </div>

          {/* Owner info */}
          <div style={{ marginTop:'16px', padding:'12px 16px',
                        background:'var(--bg)', borderRadius:'var(--radius-sm)',
                        display:'flex', alignItems:'center', gap:'10px', fontSize:'14px' }}>
            <span style={{ fontSize:'20px' }}>👤</span>
            <div>
              <span style={{ fontWeight:'600', color:'var(--navy)' }}>{cab.owner?.name}</span>
              {cab.owner?.phone && (
                <span style={{ color:'var(--text-muted)', marginLeft:'8px' }}>
                  · 📞 {cab.owner.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking section */}
      <div className="card" style={{ padding:'24px', marginBottom:'20px' }}>
        <h3 style={{ fontFamily:'Poppins', fontSize:'18px', fontWeight:'700',
                     color:'var(--navy)', marginBottom:'16px' }}>
          Book This Cab
        </h3>

        {!user && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <p style={{ color:'var(--text-muted)', marginBottom:'14px' }}>
              Login to book this cab
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary"
              style={{ width:'auto', padding:'10px 28px' }}>
              Login to Book
            </button>
          </div>
        )}

        {user && user.role === 'owner' && (
          <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)',
                        padding:'16px', textAlign:'center', color:'var(--text-muted)', fontSize:'14px' }}>
            Switch to a customer account to make bookings.
          </div>
        )}

        {bookingDone && (
          <div className="form-success">
            ✅ Booking confirmed! Check your booking history for details.
          </div>
        )}

        {user && user.role === 'customer' && !bookingDone && (
          <>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">From</label>
                <input className="form-input" name="fromLocation"
                  placeholder="e.g. Nashik" value={booking.fromLocation} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">To</label>
                <input className="form-input" name="toLocation"
                  placeholder="e.g. Pune" value={booking.toLocation} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Journey Date &amp; Time</label>
                <input className="form-input" name="journeyDate" type="datetime-local"
                  value={booking.journeyDate} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Return Date &amp; Time</label>
                <input className="form-input" name="returnDate" type="datetime-local"
                  value={booking.returnDate} onChange={handleChange} min={booking.journeyDate} />
              </div>
            </div>
            <button onClick={handleBook} disabled={submitting || !cab.isAvailable}
              className="btn-primary"
              style={{ marginTop:'18px',
                       background: !cab.isAvailable ? '#94a3b8' : 'var(--orange)' }}>
              {!cab.isAvailable ? 'Cab Currently Unavailable'
               : submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </>
        )}
      </div>

      {/* Reviews */}
      <div className="card" style={{ padding:'24px' }}>
        <h3 style={{ fontFamily:'Poppins', fontSize:'18px', fontWeight:'700',
                     color:'var(--navy)', marginBottom:'16px' }}>
          Reviews {cab.reviews?.length > 0 ? `(${cab.reviews.length})` : ''}
        </h3>

        {cab.reviews?.length === 0 && (
          <div className="empty-state" style={{ padding:'24px 0' }}>
            <div style={{ fontSize:'32px', marginBottom:'8px' }}>⭐</div>
            <div style={{ color:'var(--text-muted)', fontSize:'14px' }}>
              No reviews yet for this cab
            </div>
          </div>
        )}

        {cab.reviews?.map(review => (
          <div key={review.id} style={{ borderBottom:'1px solid var(--border)',
                                        paddingBottom:'14px', marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <span style={{ fontWeight:'700', fontSize:'14px', color:'var(--navy)' }}>
                {review.customer?.name}
              </span>
              <span style={{ color:'var(--gold)', fontSize:'16px', letterSpacing:'2px' }}>
                {'★'.repeat(review.rating)}
                <span style={{ color:'#ddd' }}>{'★'.repeat(5 - review.rating)}</span>
              </span>
            </div>
            {review.comment && (
              <p style={{ fontSize:'13px', color:'var(--text-muted)', lineHeight:'1.6' }}>
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
