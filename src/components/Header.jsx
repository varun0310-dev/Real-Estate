import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaRegUser } from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { MdDashboardCustomize } from 'react-icons/md';
import { RiLogoutBoxRLine, RiLoginBoxLine } from 'react-icons/ri';
import Dummy from '@assets/loginlogo/dummy.png';
import DefaultLogo from '@assets/logo.svg';
import LoginModal from './LoginModal ';
import { API_URL } from '../config';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profile, setProfile] = useState(null);
  const [customLogo, setCustomLogo] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Fetch custom logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings/logo`);
        if (res.data.logoUrl) {
          setCustomLogo(`${API_URL}${res.data.logoUrl}`);
        } else {
          setCustomLogo(null);
        }
      } catch (err) {
        console.error('Failed to fetch logo:', err);
      }
    };
    fetchLogo();

    const handleLogoUpdate = () => fetchLogo();
    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  // Fetch profile if authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    if (token) {
      axios
        .get(`${API_URL}/api/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setProfile(res.data.user);
        })
        .catch((err) => {
          console.error('Profile fetch error:', err);
          setProfile(null);
          if (err.response?.status === 401) {
             localStorage.removeItem('token');
             setIsAuthenticated(false);
          }
        });
    }
  }, [location.pathname]); // Re-check on nav if needed

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setProfile(null);
    setShowDropdown(false);
    navigate('/');
  };

  const getProfileImage = () => {
    if (profile?.profileImage) {
      const url = profile.profileImage.startsWith('http')
        ? profile.profileImage
        : `${API_URL}${profile.profileImage}`;
      return `${url}?t=${Date.now()}`;
    }
    return Dummy;
  };

  const isSuperAdmin = profile?.userType === 'superadmin' || profile?.role === 'superadmin';
  const isSeller = profile?.userType === 'seller';
  const canPostProperty = isAuthenticated && (isSuperAdmin || isSeller);

  return (
    <header className="bg-white shadow-md z-50 relative">
      <div className="container mx-auto px-4 flex items-center justify-between h-[85px] min-h-[85px]">
        {/* Logo */}
        <Link to="/">
          <img src={customLogo || DefaultLogo} alt="Logo" className="w-[120px]" onError={(e) => { e.target.src = DefaultLogo; }} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex space-x-8 text-gray-700 font-semibold">
          <Link to="/" className={`${location.pathname === '/' ? 'text-[#4960B2]' : ''} hover:text-[#4960B2] transition`}>Home</Link>
          <Link to="/properties" className={`${location.pathname === '/properties' ? 'text-[#4960B2]' : ''} hover:text-[#4960B2] transition`}>Properties</Link>
          <Link to="/about-us" className={`${location.pathname === '/about-us' ? 'text-[#4960B2]' : ''} hover:text-[#4960B2] transition`}>About Us</Link>
          <Link to="/contact-us" className={`${location.pathname === '/contact-us' ? 'text-[#4960B2]' : ''} hover:text-[#4960B2] transition`}>Contact Us</Link>
        </nav>

        {/* Profile Dropdown (Desktop) */}
        <div className="hidden lg:flex items-center space-x-4 relative" ref={dropdownRef}>
          <Link to="/properties" className="w-[147px] h-[48px] rounded-[12px] bg-[#4960B2] text-white flex items-center justify-center hover:bg-[#3b4f98] font-semibold text-sm">
            Find Property
          </Link>
          
          {canPostProperty && (
            <Link to="/dashboard/my-properties?addNew=true" className="w-[147px] h-[48px] rounded-[12px] bg-[#4960B2] text-white flex items-center justify-center hover:bg-[#3b4f98] font-bold text-sm shadow-md">
              Post Property
            </Link>
          )}

          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 cursor-pointer w-max select-none ml-2"
          >
            <img
              src={getProfileImage()}
              alt="User"
              onError={(e) => {
                e.target.src = Dummy;
              }}
              className="w-10 h-10 rounded-full object-cover shadow border-2 border-gray-200"
            />

            {isAuthenticated && profile && (
              <div className="flex flex-col leading-tight">
                <span className="text-[16px] font-semibold text-[#1e1e2d]">
                  {profile.name || 'User'}
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {profile.userType || 'User'}
                </span>
              </div>
            )}

            <svg
              className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Dropdown */}
          <div
            className={`absolute -right-9 top-[62px] min-w-[240px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 transition-all duration-200 ease-out overflow-hidden
              ${showDropdown ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}
            `}
            style={{ boxShadow: '0 8px 32px rgba(60, 72, 88, 0.18)' }}
          >
            {/* Top: LOGIN / REGISTER (only when NOT logged in) */}
            {!isAuthenticated && (
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <button
                  className="text-[#0077CC] font-extrabold text-[15px] tracking-wide uppercase hover:text-[#005fa3] transition-colors cursor-pointer"
                  onClick={() => {
                    setShowLoginModal(true);
                    setShowDropdown(false);
                  }}
                >
                  LOGIN / REGISTER
                </button>
              </div>
            )}

            {/* Profile & Dashboard (only when logged in) */}
            {isAuthenticated && (
              <div className="py-2 border-b border-gray-100">
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-2 px-5 py-2 text-gray-700 hover:bg-[#4960B2]/5 hover:text-[#4960B2] transition-all duration-150 text-sm font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  <HiOutlineUserCircle className="text-lg" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-5 py-2 text-gray-700 hover:bg-[#4960B2]/5 hover:text-[#4960B2] transition-all duration-150 text-sm font-medium"
                  onClick={() => setShowDropdown(false)}
                >
                  <MdDashboardCustomize className="text-lg" />
                  <span>Dashboard</span>
                </Link>
              </div>
            )}

            {/* My Activity Section */}
            <div className={`px-5 pt-3 ${isAuthenticated ? 'pb-2 border-b border-gray-100' : 'pb-4'}`}>
              <p className="text-[#1e1e2d] font-bold text-[14px] mb-2">My Activity</p>
              <div className="flex flex-col gap-1 pl-3">
                <Link
                  to="/recently-searched"
                  className="text-gray-500 text-[13px] hover:text-[#4960B2] transition-colors py-1"
                  onClick={() => setShowDropdown(false)}
                >
                  Recently Searched
                </Link>
                <Link
                  to="/recently-viewed"
                  className="text-gray-500 text-[13px] hover:text-[#4960B2] transition-colors py-1"
                  onClick={() => setShowDropdown(false)}
                >
                  Recently Viewed
                </Link>
              </div>
            </div>

            {/* Logout at the bottom (only when logged in) */}
            {isAuthenticated && (
              <div className="px-5 py-3">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500 font-semibold text-sm hover:text-red-700 transition-colors cursor-pointer w-full"
                >
                  <RiLogoutBoxRLine className="text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hamburger (Mobile) */}
        <button className="lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 space-y-3 font-semibold text-gray-700 bg-white shadow-md absolute w-full left-0 z-40 border-t border-gray-100">
          <Link to="/" className={`block py-2 ${location.pathname === '/' ? 'text-[#4960B2]' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/properties" className={`block py-2 ${location.pathname === '/properties' ? 'text-[#4960B2]' : ''}`} onClick={() => setMenuOpen(false)}>Properties</Link>
          <Link to="/about-us" className={`block py-2 ${location.pathname === '/about-us' ? 'text-[#4960B2]' : ''}`} onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link to="/contact-us" className={`block py-2 ${location.pathname === '/contact-us' ? 'text-[#4960B2]' : ''}`} onClick={() => setMenuOpen(false)}>Contact Us</Link>
          <hr />
          {isAuthenticated ? (
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="flex items-center text-red-600 py-2"
            >
              <FiLogOut />
              <span className="ml-1">Logout</span>
            </button>
          ) : (
            <button
              onClick={() => { setMenuOpen(false); setShowLoginModal(true); }}
              className="flex items-center py-2"
            >
              <FaRegUser />
              <span className="ml-1">Login / Sign Up</span>
            </button>
          )}

          {canPostProperty && (
            <Link to="/dashboard/my-properties?addNew=true" className="block bg-[#4960B2] text-white px-3 py-2 rounded text-center font-bold" onClick={() => setMenuOpen(false)}>
              Post Property
            </Link>
          )}
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </header>
  );
};

export default Header;
