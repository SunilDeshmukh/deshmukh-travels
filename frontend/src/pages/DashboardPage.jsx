import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [cabs,       setCabs]       = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [form, setForm] = useState({
    name:'', type:'', capacity:'', pricePerKm:'', location:'', imageUrl:'',
  });

  useEffect(() => {
    if (!user)                 return navigate('/login');
    if (user.role !== 'owner') return navigate('/');
    api.get('/cabs/my/listings')
      .then(async (res) => {
        const ownerCabs = res.data;
        setCabs(ownerCabs);
        const results = await Promise.all(
          ownerCabs.map(cab =>
            api.get(`/bookings/cab/${cab.id}`).then(r => r.data).catch(() => [])
          )
        );
        setBookings(results.flat());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.capacity || !form.pricePerKm || !form.location)
      return setFormError('All fields except image are required');
    setSubmitting(true); setFormError('');
    try {
      const { data } = await api.post('/cabs', {
        ...form, capacity: +form.capacity, pricePerKm: +form.pricePerKm, ownerId: user.id,
      });
      setCabs(prev => [data, ...prev]);
      setForm({ name:'', type:'', capacity:'', pricePerKm:'', location:'', imageUrl:'' });
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add cab');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cabId) => {
    if (!window.confirm('Remove this cab listing?')) return;
    try {
      await api.delete(`/cabs/${cabId}`);
      setCabs(prev => prev.filter(c => c.id !== cabId));
    } catch { alert('Failed to delete cab'); }
  };

  const handleStatusChange = async (bookingId, status) => {
    try {
      const { data } = await api.put(`/bookings/${bookingId}/status`, { status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: data.status } : b));
    } catch (err) { alert(err.response?.data?.error || 'Failed to update'); }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <p style={{ color:'var(--text-muted)', fontSize:'14px' }}>Loading your dashboard...</p>
    </div>
  );

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ maxWidth:'1000px', margin:'0 auto', display:'flex',
                      justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2>Owner Dashboard</h2>
            <p>Welcome back, {user?.name}</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            {pendingCount > 0 && (
              <span style={{ background:'var(--orange)', color:'#fff', fontSize:'12px',
                             fontWeight:'700', padding:'4px 12px', borderRadius:'999px' }}>
                {pendingCount} pending
              </span>
            )}
            <button
              onClick={() => setShowForm(f => !f)}
              className={showForm ? 'btn-nav-ghost' : 'btn-nav-primary'}
              style={{ fontSize:'14px' }}
            >
              {showForm ? 'Cancel' : '+ Add New Cab'}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">

        {/* Add cab form */}
        {showForm && (
          <div className="card" style={{ padding:'24px', marginBottom:'32px' }}>
            <h3 style={{ fontFamily:'Poppins', fontSize:'18px', color:'var(--navy)',
                         marginBottom:'20px' }}>New Cab Listing</h3>
            {formError && <div className="form-error">{formError}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {[
                { name:'name',       placeholder:'Cab name (e.g. Swift Dzire)' },
                { name:'type',       placeholder:'Type (Sedan / SUV / Hatchback)' },
                { name:'capacity',   placeholder:'Capacity (e.g. 4)',      type:'number' },
                { name:'pricePerKm', placeholder:'Price per km (e.g. 12)', type:'number' },
                { name:'location',   placeholder:'Base location (e.g. Nashik)' },
                { name:'imageUrl',   placeholder:'Image URL (optional)' },
              ].map(field => (
                <div key={field.name} className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" style={{ textTransform:'capitalize' }}>
                    {field.name === 'pricePerKm' ? 'Price per km' :
                     field.name === 'imageUrl'   ? 'Image URL (optional)' : field.name}
                  </label>
                  <input
                    className="form-input"
                    name={field.name}
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{ marginTop:'20px', width:'auto', padding:'11px 32px' }}
            >
              {submitting ? 'Adding...' : 'Add Cab'}
            </button>
          </div>
        )}

        {/* Cab listings */}
        <div className="dashboard-section-title">
          Your Cabs ({cabs.length})
        </div>

        {cabs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <div className="empty-state-title">No cabs listed yet</div>
            <div className="empty-state-desc">Click + Add New Cab to get started</div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'40px' }}>
          {cabs.map(cab => (
            <div key={cab.id} className="card" style={{ padding:'18px', display:'flex',
                                                         justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:'Poppins', fontWeight:'700',
                              fontSize:'16px', color:'var(--navy)', marginBottom:'4px' }}>
                  {cab.name}
                </div>
                <div style={{ fontSize:'13px', color:'var(--text-muted)' }}>
                  {cab.type} · {cab.location} · ₹{cab.pricePerKm}/km · {cab.capacity} seats
                </div>
                <span style={{ fontSize:'11px', fontWeight:'600', marginTop:'6px', display:'inline-block',
                               color: cab.isAvailable ? '#166534' : '#64748b' }}>
                  {cab.isAvailable ? '● Available' : '○ Unavailable'}
                </span>
              </div>
              <button onClick={() => handleDelete(cab.id)} className="btn-danger">
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div className="dashboard-section-title">
          Bookings ({bookings.length})
        </div>

        {bookings.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No bookings yet</div>
            <div className="empty-state-desc">Bookings will appear here when customers book your cabs</div>
          </div>
        )}

        {['pending','confirmed','completed','cancelled'].map(statusGroup => {
          const group = bookings.filter(b => b.status === statusGroup);
          if (group.length === 0) return null;
          return (
            <div key={statusGroup} style={{ marginBottom:'28px' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', textTransform:'uppercase',
                            letterSpacing:'0.08em', color:'var(--text-muted)',
                            marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span className={`status-badge status-${statusGroup}`}>
                  {statusGroup} ({group.length})
                </span>
              </div>
              {group.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div style={{ display:'flex', justifyContent:'space-between',
                                alignItems:'flex-start', marginBottom:'8px' }}>
                    <div>
                      <div className="booking-route">
                        {booking.fromLocation} → {booking.toLocation}
                      </div>
                      <div className="booking-dates">
                        {new Date(booking.journeyDate).toDateString()} →{' '}
                        {new Date(booking.returnDate).toDateString()}
                      </div>
                    </div>
                    <span style={{ fontSize:'12px', background:'var(--bg)',
                                   padding:'3px 10px', borderRadius:'999px', color:'var(--text-muted)' }}>
                      {cabs.find(c => c.id === booking.cabId)?.name ?? 'Cab'}
                    </span>
                  </div>
                  {booking.status === 'pending' && (
                    <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                      <button className="btn-confirm"
                        onClick={() => handleStatusChange(booking.id, 'confirmed')}>
                        ✓ Confirm
                      </button>
                      <button className="btn-danger"
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <button style={{ marginTop:'10px', fontSize:'13px', padding:'6px 16px',
                                     border:'1px solid #93c5fd', borderRadius:'6px',
                                     color:'#1e40af', background:'transparent', cursor:'pointer' }}
                      onClick={() => handleStatusChange(booking.id, 'completed')}>
                      Mark as Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}