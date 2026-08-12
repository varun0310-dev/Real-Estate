import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiEye, FiTrash2, FiMapPin, FiArrowRight, FiClock } from 'react-icons/fi';
import { LuBed, LuBath } from 'react-icons/lu';
import { FiMaximize } from 'react-icons/fi';
import { RiLoginBoxLine } from 'react-icons/ri';
import LoginModal from '../components/LoginModal ';
import {
    getRecentSearches,
    getRecentViews,
    clearRecentSearches,
    clearRecentViews,
    groupByDate,
} from '../hooks/useRecentActivity';
import { API_URL } from '../config';

const TABS = [
    { key: 'SEARCHED', label: 'Recent Searches', icon: FiSearch },
    { key: 'VIEWED', label: 'Viewed', icon: FiEye },
];

const RecentActivity = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('activeTab') || 'SEARCHED';
    const navigate = useNavigate();

    const [searches, setSearches] = useState([]);
    const [views, setViews] = useState([]);
    const [showLoginBanner, setShowLoginBanner] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const isAuthenticated = !!localStorage.getItem('token');

    // Load data
    const loadData = () => {
        setSearches(getRecentSearches());
        setViews(getRecentViews());
    };

    useEffect(() => {
        loadData();
        const handler = () => loadData();
        window.addEventListener('recentActivityUpdated', handler);
        return () => window.removeEventListener('recentActivityUpdated', handler);
    }, []);

    const setTab = (key) => {
        setSearchParams({ activeTab: key });
    };

    const handleSearchClick = (item) => {
        // Navigate to properties page with the saved filters as query params
        const f = item.filters || {};
        const params = new URLSearchParams();
        if (f.location) params.set('location', f.location);
        if (f.cityId && f.cityId !== 'all') params.set('cityId', f.cityId);
        if (f.query) params.set('q', f.query);
        navigate(`/properties?${params.toString()}`);
    };

    const handleClearSearches = () => {
        clearRecentSearches();
        setSearches([]);
    };

    const handleClearViews = () => {
        clearRecentViews();
        setViews([]);
    };

    const searchGroups = groupByDate(searches);
    const viewGroups = groupByDate(views);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page container */}
            <div className="max-w-[1100px] mx-auto px-4 py-8 md:py-12">
                {/* Tabs */}
                <div className="flex items-center gap-0 border-b border-gray-200 mb-8">
                    {TABS.map((tab) => {
                        const count = tab.key === 'SEARCHED' ? searches.length : views.length;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors cursor-pointer
                                    ${isActive
                                        ? 'text-[#4960B2]'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="text-base" />
                                <span>{count} {tab.label}</span>
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#4960B2] rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === 'SEARCHED' && (
                    <div>
                        {/* Clear button */}
                        {searches.length > 0 && (
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={handleClearSearches}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                    <FiTrash2 className="text-sm" />
                                    Clear All Searches
                                </button>
                            </div>
                        )}

                        {searches.length === 0 ? (
                            <EmptyState
                                icon={FiSearch}
                                title="No recent searches"
                                subtitle="Your search history will appear here when you search for properties"
                            />
                        ) : (
                            Object.entries(searchGroups).map(([dateLabel, items]) => (
                                <div key={dateLabel} className="mb-8">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <FiClock className="text-sm" />
                                        {dateLabel}
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSearchClick(item)}
                                                className="flex items-center gap-4 px-5 py-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#4960B2]/20 transition-all group cursor-pointer text-left w-full"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-[#4960B2]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#4960B2]/20 transition-colors">
                                                    <FiSearch className="text-[#4960B2] text-lg" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[14px] font-semibold text-[#1e1e2d] truncate group-hover:text-[#4960B2] transition-colors">
                                                        {item.label}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <FiArrowRight className="text-gray-300 group-hover:text-[#4960B2] transition-colors flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'VIEWED' && (
                    <div>
                        {views.length > 0 && (
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#1e1e2d]">Viewed Properties</h2>
                                    <p className="text-xs text-[#4960B2] font-medium mt-0.5">Contact now to close the deal</p>
                                </div>
                                <button
                                    onClick={handleClearViews}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                    <FiTrash2 className="text-sm" />
                                    Clear All
                                </button>
                            </div>
                        )}

                        {views.length === 0 ? (
                            <EmptyState
                                icon={FiEye}
                                title="No recently viewed properties"
                                subtitle="Properties you view will appear here so you can quickly revisit them"
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {views.map((item) => (
                                    <Link
                                        key={item.id}
                                        to={`/properties`}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#4960B2]/20 transition-all duration-300 group"
                                    >
                                        {/* Image */}
                                        <div className="relative overflow-hidden aspect-[16/10]">
                                            <img
                                                src={item.image ? `${API_URL}${item.image}` : 'https://via.placeholder.com/600x400?text=No+Image'}
                                                alt={item.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            {item.categoryName && (
                                                <span className="absolute top-3 left-3 bg-[#4960B2] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {item.categoryName}
                                                </span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="p-4">
                                            <div className="text-lg font-bold text-[#4960B2] mb-1">
                                                ${item.price?.toLocaleString()}
                                            </div>
                                            <h3 className="text-sm font-bold text-[#1e1e2d] truncate mb-1 group-hover:text-[#4960B2] transition-colors">
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 flex items-center mb-3">
                                                <FiMapPin className="mr-1 text-[#4960B2] flex-shrink-0" />
                                                <span className="truncate">{item.address}</span>
                                            </p>

                                            {/* Stats row */}
                                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                                <span className="flex items-center text-[11px] text-gray-500 font-medium">
                                                    <LuBed className="mr-1 text-sm" /> {item.bedrooms} Bed
                                                </span>
                                                <span className="flex items-center text-[11px] text-gray-500 font-medium">
                                                    <LuBath className="mr-1 text-sm" /> {item.bathrooms} Bath
                                                </span>
                                                <span className="flex items-center text-[11px] text-gray-500 font-medium">
                                                    <FiMaximize className="mr-1 text-sm" /> {item.size} Sqft
                                                </span>
                                            </div>

                                            {/* Viewed time */}
                                            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                                <FiClock className="text-[10px]" />
                                                Viewed {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Login/Register Banner (like 99acres — only when NOT logged in) */}
                {!isAuthenticated && showLoginBanner && (
                    <div className="mt-10 bg-gradient-to-r from-[#f0f4ff] to-[#e8ecff] border border-[#4960B2]/10 rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#4960B2]/10 flex items-center justify-center flex-shrink-0">
                                <RiLoginBoxLine className="text-[#4960B2] text-2xl" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold text-[#1e1e2d]">Login or register to save your activity</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Access your activity across devices by registering with us</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <FiArrowRight 
                                className="text-[#4960B2] text-xl cursor-pointer hover:translate-x-1 transition-transform" 
                                onClick={() => setShowLoginModal(true)}
                            />
                            <button
                                onClick={() => setShowLoginBanner(false)}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Login Modal */}
                {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
            </div>
        </div>
    );
};

// Empty state component
const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
            <Icon className="text-gray-300 text-3xl" />
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-1">{title}</h3>
        <p className="text-sm text-gray-400 max-w-xs">{subtitle}</p>
    </div>
);

export default RecentActivity;
