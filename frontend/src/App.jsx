import { Routes, Route } from 'react-router-dom';
import { useAuth }       from './context/AuthContext';
import Navbar             from './components/Navbar';    
import GuestRoute from './components/GuestRoute'; 
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage'; 
import CabsPage          from './pages/CabsPage';
import CabDetailPage from './pages/CabDetailPage';
import BookingHistoryPage from './pages/BookingHistoryPage';

export default function App() {
  const { loading } = useAuth();
  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar /> 
      <Routes>
        <Route path="/"         element={<CabsPage />}    />
        <Route path="/login"     element={<GuestRoute><LoginPage /></GuestRoute>}    />
        <Route path="/register"  element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cabs/:id" element={<CabDetailPage />} />
        <Route path="/bookings" element={<BookingHistoryPage />} />
      </Routes>
    </>
  );
}