// client/src/components/GuestRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

export default function GuestRoute({ children }) {
  const { user } = useAuth();

  if (!user) return children;  // not logged in → show login/register page

  // logged in → redirect based on role
  return <Navigate to={user.role === 'owner' ? '/dashboard' : '/'} replace />;
}