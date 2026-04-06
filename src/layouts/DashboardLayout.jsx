import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@components/dashboard/Sidebar';
import Navbar from '@components/dashboard/Navbar';
import axios from 'axios';
import { API_URL } from '../config';

const DashboardLayout = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data.user);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="p-6">Loading...</div>;

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Get current route title from path
  const getTitleFromPath = (path) => {
    const segments = path.split('/');
    const route = segments[2] || 'Dashboard';
    return route
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = getTitleFromPath(location.pathname);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar 
        onNavigate={handleNavigation} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        userType={profile?.userType}
      />

      {/* Main content area */}
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} w-full min-h-screen bg-gray-100`}>
        {/* Top navbar */}
        <div className="sticky top-0 z-50 bg-white">
          <Navbar title={pageTitle} onProfileClick={() => navigate('/dashboard/profile')} />
        </div>

        {/* Page content */}
        <div className="p-4">
          <Outlet context={{ profile, setProfile }} />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
