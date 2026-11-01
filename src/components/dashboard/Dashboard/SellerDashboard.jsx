import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiHeart, FiClock, FiPlus, FiArrowRight, FiShield, FiCheckCircle } from 'react-icons/fi';
import { FaBuilding, FaUsers, FaCrown } from 'react-icons/fa';
import DashboardHeaders from './DashboardHeaders';
import PropertiesViews from './PropertiesViews';
import VisitorInsightsChart from './VisitorInsights';
import RecentMessages from './RecentMessages';
import DashboardMap from './DashboardMap';
import { API_URL } from '../../../config';

const SellerDashboard = ({ data, profile }) => {
    const navigate = useNavigate();
    const metrics = data?.metrics || {};
    const subscription = data?.subscription;
    const recentProperties = data?.recentProperties || [];
    const recentMessages = data?.recentMessages || [];
    const viewsTrend = data?.viewsTrend || [];
    const visitorInsights = data?.visitorInsights || [];
    const mapProperties = data?.mapProperties || [];

    // Calculate expiry days
    const isSubscribed = Boolean(subscription && new Date(subscription.expiryDate) > new Date());
    const daysRemaining = isSubscribed
        ? Math.max(0, Math.ceil((new Date(subscription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0;

    // 4 Top Cards according to design screenshot
    const stats = [
        {
            label: 'All Properties',
            value: metrics.myPropertiesCount ?? 0,
            subtext: `${metrics.myApprovedProperties ?? 0} Approved • ${metrics.myPendingProperties ?? 0} Pending`,
            icon: <FaBuilding size={18} className="text-white" />,
            cardBg: 'bg-orange-50/70',
            dotColor: 'bg-orange-500',
        },
        {
            label: 'Total Views',
            value: (metrics.totalViews ?? 0).toLocaleString(),
            subtext: 'Property impressions',
            icon: <FiEye size={18} className="text-white" />,
            cardBg: 'bg-emerald-50/70',
            dotColor: 'bg-emerald-500',
        },
        {
            label: 'Buyer Inquiries',
            value: metrics.totalInquiries ?? 0,
            subtext: 'Direct lead conversations',
            icon: <FaUsers size={18} className="text-white" />,
            cardBg: 'bg-purple-50/70',
            dotColor: 'bg-purple-500',
        },
        {
            label: 'Total Favorites',
            value: metrics.totalFavorites ?? 0,
            subtext: 'Saved by prospective buyers',
            icon: <FiHeart size={18} className="text-white" />,
            cardBg: 'bg-pink-50/70',
            dotColor: 'bg-pink-500',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Subscription Banner */}
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#4960B2] text-white flex items-center justify-center shadow-sm shrink-0">
                        {isSubscribed ? <FaCrown size={22} className="text-amber-300" /> : <FiClock size={22} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Current Plan</span>
                            <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                    isSubscribed
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                            >
                                {isSubscribed ? 'Active' : 'No Active Plan'}
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mt-0.5">
                            {subscription?.planName || (subscription?.plan ? subscription.plan.toUpperCase() : 'Free Tier')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isSubscribed ? (
                                <>
                                    Valid until{' '}
                                    <span className="font-semibold text-gray-700">
                                        {new Date(subscription.expiryDate).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>{' '}
                                    ({daysRemaining} days left)
                                </>
                            ) : (
                                'Subscribe to unlock premium listing features and verified badge.'
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <Link
                        to="/pricing"
                        className="px-4 py-2 rounded-xl bg-[#4960B2] hover:bg-[#3b4f98] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 w-full md:w-auto"
                    >
                        <FaCrown size={12} className="text-amber-300" />
                        {isSubscribed ? 'Upgrade / Renew' : 'Upgrade Plan'}
                    </Link>
                    <Link
                        to="/dashboard/package"
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-xs flex items-center justify-center w-full md:w-auto"
                    >
                        Plan Details
                    </Link>
                </div>
            </div>

            {/* 4 Stats Cards */}
            <DashboardHeaders stats={stats} />

            {/* Charts & Map Grid (As Per User Screenshot Design) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column (58% / 7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Property Views Bar Chart */}
                    <PropertiesViews
                        title="Property Views"
                        subtitle="Weekly impressions across platforms"
                        data={viewsTrend}
                        xKey="day"
                        primaryKey="online"
                        secondaryKey="offline"
                        primaryLabel="Online Views"
                        secondaryLabel="Offline Impressions"
                        primaryColor="#0095FF"
                        secondaryColor="#00E096"
                    />

                    {/* Visitor Insights Line Chart */}
                    <VisitorInsightsChart
                        title="Visitor Insights"
                        subtitle="Monthly visitor and buyer engagement trends"
                        data={visitorInsights}
                        xKey="month"
                        line1Key="customer"
                        line2Key="newCustomer"
                        line1Label="Regular Visitors"
                        line2Label="New Inquirers"
                        line1Color="#A020F0"
                        line2Color="#00E096"
                    />
                </div>

                {/* Right Column (42% / 5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                    {/* Recent Messages */}
                    <RecentMessages
                        messages={recentMessages}
                        title="Recent Inquiries"
                        viewAllLink="/dashboard/messages"
                    />

                    {/* Map View */}
                    <DashboardMap
                        title="My Property Locations"
                        properties={mapProperties}
                        exploreLink="/properties"
                    />
                </div>
            </div>

            {/* Recent Properties Section */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-bold text-[#111827]">My Recent Listings</h2>
                        <p className="text-xs text-gray-400">Manage your active and pending real estate postings</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/dashboard/my-properties?addNew=true"
                            className="px-3.5 py-1.5 rounded-xl bg-[#4960B2] hover:bg-[#3b4f98] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                            <FiPlus size={14} /> Add Property
                        </Link>
                        <Link
                            to="/dashboard/my-properties"
                            className="text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] flex items-center gap-1 ml-2 transition"
                        >
                            View All <FiArrowRight size={13} />
                        </Link>
                    </div>
                </div>

                {recentProperties.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                                <tr>
                                    <th className="p-3 rounded-l-lg">Property</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Listed Date</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right rounded-r-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentProperties.map((property) => {
                                    const imageSrc =
                                        property.images && property.images.length > 0
                                            ? property.images[0].startsWith('http')
                                                ? property.images[0]
                                                : `${API_URL}/${property.images[0].replace(/^\/+/, '')}`
                                            : 'https://via.placeholder.com/80';

                                    const isApproved = property.propertyStatus === 'Approved';
                                    const isPending = property.propertyStatus === 'Pending';

                                    return (
                                        <tr key={property._id} className="hover:bg-gray-50/60 transition">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={imageSrc}
                                                        alt={property.title}
                                                        className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                                                        onError={(e) => {
                                                            e.target.src = 'https://via.placeholder.com/80';
                                                        }}
                                                    />
                                                    <div className="max-w-[180px]">
                                                        <p className="font-bold text-gray-900 truncate">
                                                            {property.title}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 truncate">
                                                            {property.address || property.cityId?.name || 'Local'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-gray-600">
                                                {property.categoryId?.name || property.propertyType || 'Residential'}
                                            </td>
                                            <td className="p-3 font-bold text-gray-900">
                                                ₹{Number(property.price || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-3 text-gray-500">
                                                {new Date(property.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                                        isApproved
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : isPending
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                                >
                                                    {property.propertyStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Link
                                                    to={`/properties/${property._id}`}
                                                    className="text-xs font-bold text-[#4960B2] hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <FaBuilding className="mx-auto text-gray-300 mb-2" size={28} />
                        <p className="text-xs font-semibold text-gray-600">You haven't listed any properties yet</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 mb-3">Add your first property listing to start receiving buyer inquiries</p>
                        <Link
                            to="/dashboard/my-properties?addNew=true"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4960B2] text-white text-xs font-bold shadow-xs hover:bg-[#3b4f98] transition"
                        >
                            <FiPlus size={14} /> Add Property
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerDashboard;

