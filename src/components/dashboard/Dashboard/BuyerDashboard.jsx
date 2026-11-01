import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiHeart,
    FiMapPin,
    FiArrowRight,
    FiCompass,
    FiMessageSquare,
    FiSliders,
} from 'react-icons/fi';
import { FaBuilding, FaUsers, FaBed, FaBath } from 'react-icons/fa';
import DashboardHeaders from './DashboardHeaders';
import RecentMessages from './RecentMessages';
import DashboardMap from './DashboardMap';
import { API_URL } from '../../../config';

const BuyerDashboard = ({ data, profile }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const metrics = data?.metrics || {};
    const recommendedProperties = data?.recommendedProperties || [];
    const recentMessages = data?.recentMessages || [];
    const categoryCounts = data?.categoryCounts || [];

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/properties?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            navigate('/properties');
        }
    };

    // 4 Top Cards according to design screenshot
    const stats = [
        {
            label: 'Available Properties',
            value: (metrics.totalAvailableProperties ?? 0).toLocaleString(),
            subtext: 'Verified listings for sale & rent',
            icon: <FaBuilding size={18} className="text-white" />,
            cardBg: 'bg-orange-50/70',
            dotColor: 'bg-orange-500',
        },
        {
            label: 'My Inquiries',
            value: metrics.myInquiriesCount ?? 0,
            subtext: 'Active seller conversations',
            icon: <FaUsers size={18} className="text-white" />,
            cardBg: 'bg-emerald-50/70',
            dotColor: 'bg-emerald-500',
        },
        {
            label: 'Saved & Viewed',
            value: metrics.savedFavoritesCount ?? 0,
            subtext: 'Homes on your watchlist',
            icon: <FiHeart size={18} className="text-white" />,
            cardBg: 'bg-purple-50/70',
            dotColor: 'bg-purple-500',
        },
        {
            label: 'Property Categories',
            value: metrics.categoriesCount ?? 0,
            subtext: 'Apartments, Villas & Commercial',
            icon: <FiCompass size={18} className="text-white" />,
            cardBg: 'bg-pink-50/70',
            dotColor: 'bg-pink-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Buyer Welcome Banner with Search Bar */}
            <div className="relative overflow-hidden bg-gradient-to-r from-[#1E293B] via-[#243354] to-[#4960B2] rounded-2xl p-6 md:p-8 text-white shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase border border-white/20">
                        Buyer Hub
                    </span>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                        Find Your Perfect Home or Investment Property
                    </h1>
                    <p className="text-xs md:text-sm text-gray-200">
                        Explore verified listings, connect directly with property sellers, and track all your active inquiries in one place.
                    </p>

                    {/* Integrated Quick Search */}
                    <form onSubmit={handleSearch} className="pt-2 flex items-center gap-2">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by city, neighborhood, or property title..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-3 rounded-xl bg-[#4960B2] hover:bg-[#3b4f98] text-white font-bold text-xs transition shadow-sm shrink-0"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Decorative background circle */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
            </div>

            {/* 4 Stats Cards */}
            <DashboardHeaders stats={stats} />

            {/* Recommended Properties & Category Exploration */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column (7 cols): Recommended Listings & Categories */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Recommended Properties Grid */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-[#111827]">Recommended For You</h2>
                                <p className="text-xs text-gray-400">Newly approved properties matching top market demand</p>
                            </div>
                            <Link
                                to="/properties"
                                className="text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] flex items-center gap-1 transition"
                            >
                                Browse All <FiArrowRight size={13} />
                            </Link>
                        </div>

                        {recommendedProperties.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {recommendedProperties.slice(0, 4).map((prop) => {
                                    const imageSrc =
                                        prop.images && prop.images.length > 0
                                            ? prop.images[0].startsWith('http')
                                                ? prop.images[0]
                                                : `${API_URL}/${prop.images[0].replace(/^\/+/, '')}`
                                            : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60';

                                    return (
                                        <div
                                            key={prop._id}
                                            className="group rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition duration-300 flex flex-col bg-white"
                                        >
                                            <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                                                <img
                                                    src={imageSrc}
                                                    alt={prop.title}
                                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60';
                                                    }}
                                                />
                                                <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    {prop.categoryId?.name || 'Property'}
                                                </span>
                                                <span className="absolute bottom-2.5 left-2.5 bg-[#4960B2] text-white px-2 py-0.5 rounded text-xs font-black shadow-sm">
                                                    ₹{Number(prop.price || 0).toLocaleString('en-IN')}
                                                </span>
                                            </div>

                                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-xs font-bold text-gray-900 group-hover:text-[#4960B2] transition truncate">
                                                        {prop.title}
                                                    </h3>
                                                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1 truncate">
                                                        <FiMapPin size={11} className="text-gray-400 shrink-0" />
                                                        {prop.address || prop.cityId?.name || 'Prime Location'}
                                                    </p>
                                                </div>

                                                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                                                    <div className="flex items-center gap-2.5">
                                                        {prop.bedrooms ? (
                                                            <span className="flex items-center gap-1">
                                                                <FaBed size={12} className="text-gray-400" /> {prop.bedrooms}
                                                            </span>
                                                        ) : null}
                                                        {prop.bathrooms ? (
                                                            <span className="flex items-center gap-1">
                                                                <FaBath size={11} className="text-gray-400" /> {prop.bathrooms}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <Link
                                                        to={`/properties/${prop._id}`}
                                                        className="text-xs font-bold text-[#4960B2] hover:underline"
                                                    >
                                                        Details →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                No properties found at the moment.
                            </div>
                        )}
                    </div>

                    {/* Explore Categories */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-base font-bold text-[#111827]">Explore by Category</h2>
                            <Link to="/properties" className="text-xs font-semibold text-[#4960B2] hover:underline">
                                View Categories
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {categoryCounts.map((cat) => (
                                <Link
                                    key={cat._id}
                                    to={`/properties?category=${encodeURIComponent(cat.name)}`}
                                    className="p-3 rounded-xl border border-gray-100 hover:border-[#4960B2] hover:bg-blue-50/30 transition text-center group"
                                >
                                    <p className="text-xs font-bold text-gray-800 group-hover:text-[#4960B2]">
                                        {cat.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {cat.count} {cat.count === 1 ? 'Listing' : 'Listings'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (5 cols): Inquiries & Map View */}
                <div className="lg:col-span-5 space-y-5">
                    {/* Recent Inquiries & Responses */}
                    <RecentMessages
                        messages={recentMessages}
                        title="My Inquiries with Sellers"
                        viewAllLink="/dashboard/messages"
                    />

                    {/* Dashboard Map */}
                    <DashboardMap
                        title="Properties Across Market"
                        properties={recommendedProperties}
                        exploreLink="/properties"
                    />
                </div>
            </div>
        </div>
    );
};

export default BuyerDashboard;

