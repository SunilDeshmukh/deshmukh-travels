import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    userService.getAll()
      .then(res => setUsers(res.data))
      .catch(()  => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error)   return <p style={{color:'red'}}>{error}</p>;

  return (
    <div style={{padding: '2rem'}}>
      <h1>Users</h1>
      {users.map(u => (
        <div key={u.id} style={{padding:'8px 0', borderBottom:'1px solid #eee'}}>
          <strong>{u.name}</strong> — {u.email}
        </div>
      ))}
    </div>
  );
}