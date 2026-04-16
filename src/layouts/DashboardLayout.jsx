import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@components/dashboard/Sidebar';
import Navbar from '@components/dashboard/Navbar';
import axios from 'axios';
import { API_URL } from '../config';

// Routes that only superadmin can access
const SUPERADMIN_ONLY_ROUTES = [
  '/dashboard/settings',
  '/dashboard/manage-users',
  '/dashboard/manage-roles',
];

const DashboardLayout = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
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

  // Check superadmin route access whenever the path or profile changes
  useEffect(() => {
    if (!profile) return;

    const isSuperAdminRoute = SUPERADMIN_ONLY_ROUTES.includes(location.pathname);
    const isSuperAdmin = profile.userType === 'superadmin';

    if (isSuperAdminRoute && !isSuperAdmin) {
      setAccessDenied(true);
      // Redirect to dashboard after brief delay to show the message
      const timer = setTimeout(() => {
        navigate('/dashboard');
        setAccessDenied(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setAccessDenied(false);
    }
  }, [location.pathname, profile, navigate]);

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
          {accessDenied ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center bg-white rounded-2xl shadow-lg border border-red-100 p-10 max-w-md">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#0D1C44] mb-2">Access Denied</h2>
                <p className="text-gray-400 text-sm">This page is restricted to Super Admin users only. Redirecting to dashboard...</p>
              </div>
            </div>
          ) : (
            <Outlet context={{ profile, setProfile }} />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

