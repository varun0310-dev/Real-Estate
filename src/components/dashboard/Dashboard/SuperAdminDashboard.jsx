import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiDollarSign,
    FiDownload,
    FiUsers,
    FiLayers,
    FiTag,
    FiSettings,
    FiArrowRight,
    FiCheckCircle,
    FiShield,
    FiFileText,
} from 'react-icons/fi';
import { FaBuilding, FaCrown, FaUsersCog, FaReceipt } from 'react-icons/fa';
import DashboardHeaders from './DashboardHeaders';
import PropertiesViews from './PropertiesViews';
import VisitorInsightsChart from './VisitorInsights';
import RecentMessages from './RecentMessages';
import generateInvoicePDF from '../../../utils/generateInvoicePDF';
import { API_URL } from '../../../config';

const SuperAdminDashboard = ({ data, profile }) => {
    const metrics = data?.metrics || {};
    const revenueTrend = data?.revenueTrend || [];
    const userGrowth = data?.userGrowth || [];
    const recentTransactions = data?.recentTransactions || [];
    const recentUsers = data?.recentUsers || [];
    const recentConversations = data?.recentConversations || [];

    // 4 Metrics for Super Admin
    const stats = [
        {
            label: 'Total Platform Revenue',
            value: `₹${(metrics.totalRevenue || 0).toLocaleString('en-IN')}`,
            subtext: `${metrics.paidTransactionsCount || 0} Paid Transactions`,
            icon: <FiDollarSign size={20} className="text-white" />,
            cardBg: 'bg-orange-50/70',
            dotColor: 'bg-orange-500',
        },
        {
            label: 'All Properties',
            value: metrics.totalProperties ?? 0,
            subtext: `${metrics.activeProperties ?? 0} Approved • ${metrics.pendingProperties ?? 0} Pending`,
            icon: <FaBuilding size={18} className="text-white" />,
            cardBg: 'bg-emerald-50/70',
            dotColor: 'bg-emerald-500',
        },
        {
            label: 'Platform Users',
            value: metrics.totalUsers ?? 0,
            subtext: `${metrics.totalSellers ?? 0} Sellers • ${metrics.totalBuyers ?? 0} Buyers`,
            icon: <FiUsers size={18} className="text-white" />,
            cardBg: 'bg-purple-50/70',
            dotColor: 'bg-purple-500',
        },
        {
            label: 'Active Subscriptions',
            value: metrics.activeSubscriptions ?? 0,
            subtext: 'Pro & Verified accounts',
            icon: <FaCrown size={18} className="text-white" />,
            cardBg: 'bg-pink-50/70',
            dotColor: 'bg-pink-500',
        },
    ];

    // Quick Admin Shortcuts
    const shortcuts = [
        { label: 'Manage Users', path: '/dashboard/manage-users', icon: <FiUsers size={15} />, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
        { label: 'Subscriptions', path: '/dashboard/subscriptions', icon: <FaCrown size={14} />, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
        { label: 'Transactions', path: '/dashboard/transactions', icon: <FaReceipt size={14} />, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
        { label: 'Coupons', path: '/dashboard/coupons', icon: <FiTag size={15} />, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
        { label: 'Categories', path: '/dashboard/categories', icon: <FiLayers size={15} />, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
        { label: 'Platform Settings', path: '/dashboard/settings', icon: <FiSettings size={15} />, color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    ];

    return (
        <div className="space-y-6">
            {/* Super Admin Welcome & Shortcut Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-[#0F172A] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase tracking-widest border border-blue-400/30">
                        <FiShield size={11} /> Super Admin Control Center
                    </div>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight">
                        Platform Overview & Revenue Hub
                    </h1>
                    <p className="text-xs text-gray-300">
                        Monitor live transactions, user subscriptions, listings moderation, and system activities.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        to="/dashboard/transactions"
                        className="px-4 py-2 rounded-xl bg-white text-gray-900 font-bold text-xs hover:bg-gray-100 transition shadow-sm flex items-center gap-1.5"
                    >
                        <FaReceipt size={12} className="text-[#4960B2]" /> All Invoices
                    </Link>
                    <Link
                        to="/dashboard/manage-users"
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition flex items-center gap-1.5"
                    >
                        <FaUsersCog size={13} /> Manage Users
                    </Link>
                </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {shortcuts.map((sc, idx) => (
                    <Link
                        key={idx}
                        to={sc.path}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition border border-transparent shadow-2xs ${sc.color}`}
                    >
                        {sc.icon}
                        <span>{sc.label}</span>
                    </Link>
                ))}
            </div>

            {/* 4 Stats Cards */}
            <DashboardHeaders stats={stats} />

            {/* Platform Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Revenue Trend Bar Chart & User Growth Line Chart */}
                <div className="lg:col-span-7 space-y-5">
                    {/* Platform Revenue Trend */}
                    <PropertiesViews
                        title="Platform Revenue Analytics"
                        subtitle="Monthly subscription collections and revenue inflow"
                        data={revenueTrend}
                        xKey="month"
                        primaryKey="revenue"
                        secondaryKey="transactions"
                        primaryLabel="Revenue (₹)"
                        secondaryLabel="Paid Subscriptions"
                        primaryColor="#4960B2"
                        secondaryColor="#10B981"
                        formatValue={(val) => `₹${Number(val || 0).toLocaleString('en-IN')}`}
                    />

                    {/* Platform User Growth */}
                    <VisitorInsightsChart
                        title="User Registrations Trend"
                        subtitle="New sellers vs prospective buyers onboarding"
                        data={userGrowth}
                        xKey="month"
                        line1Key="sellers"
                        line2Key="buyers"
                        line1Label="New Sellers"
                        line2Label="New Buyers"
                        line1Color="#F59E0B"
                        line2Color="#3B82F6"
                    />
                </div>

                {/* Right Column: Platform Conversations & Recent Registrations */}
                <div className="lg:col-span-5 space-y-5">
                    {/* Live Conversations Monitor */}
                    <RecentMessages
                        messages={recentConversations}
                        title="Platform Conversations"
                        viewAllLink="/dashboard/conversations"
                    />

                    {/* Recently Registered Users */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-[#111827]">New Platform Users</h2>
                                <p className="text-xs text-gray-400">Latest registrations across roles</p>
                            </div>
                            <Link
                                to="/dashboard/manage-users"
                                className="text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] flex items-center gap-1 transition"
                            >
                                View All <FiArrowRight size={13} />
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {recentUsers.slice(0, 5).map((user) => {
                                const avatar = user.profileImage
                                    ? user.profileImage.startsWith('http')
                                        ? user.profileImage
                                        : `${API_URL}/${user.profileImage.replace(/^\/+/, '')}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4960B2&color=fff`;

                                const isSeller = user.userType === 'seller';
                                const isSuper = user.userType === 'superadmin';

                                return (
                                    <div
                                        key={user._id}
                                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={avatar}
                                                alt={user.name}
                                                className="w-9 h-9 rounded-full object-cover border border-gray-100 shrink-0"
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4960B2&color=fff`;
                                                }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">
                                                    {user.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        <span
                                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                                                isSuper
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : isSeller
                                                    ? 'bg-blue-100 text-[#4960B2]'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {user.userType}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions & Direct Invoice Download Table */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-[#111827]">Recent Seller Transactions</h2>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                Invoices Available
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Subscription payments received. You can download the official PDF invoice for any transaction.
                        </p>
                    </div>

                    <Link
                        to="/dashboard/transactions"
                        className="text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] flex items-center gap-1 transition"
                    >
                        View All Transactions <FiArrowRight size={13} />
                    </Link>
                </div>

                {recentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                                <tr>
                                    <th className="p-3 rounded-l-lg">Seller Details</th>
                                    <th className="p-3">Plan / Cycle</th>
                                    <th className="p-3">Amount Paid</th>
                                    <th className="p-3">Payment Date</th>
                                    <th className="p-3">Invoice #</th>
                                    <th className="p-3 text-right rounded-r-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentTransactions.map((tx) => {
                                    const seller = tx.seller || {};
                                    const avatar = seller.profileImage
                                        ? seller.profileImage.startsWith('http')
                                            ? seller.profileImage
                                            : `${API_URL}/${seller.profileImage.replace(/^\/+/, '')}`
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'Seller')}&background=4960B2&color=fff`;

                                    return (
                                        <tr key={tx._id} className="hover:bg-gray-50/60 transition">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={avatar}
                                                        alt={seller.name}
                                                        className="w-9 h-9 rounded-full object-cover border border-gray-100 shadow-2xs"
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'Seller')}&background=4960B2&color=fff`;
                                                        }}
                                                    />
                                                    <div className="max-w-[200px]">
                                                        <p className="font-bold text-gray-900 truncate">
                                                            {seller.name || 'Seller'}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 truncate">
                                                            {seller.email || seller.companyName || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-gray-800">
                                                        {tx.planName || (tx.plan ? tx.plan.toUpperCase() : 'Standard')}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-400">
                                                        ({tx.billingCycle === 'annual' ? 'Annual' : 'Monthly'})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 font-black text-gray-900">
                                                ₹{Number(tx.finalAmount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-3 text-gray-500">
                                                {new Date(tx.paidAt || tx.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="p-3">
                                                <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                    {tx.invoiceNumber || 'INV-PENDING'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={() => generateInvoicePDF(tx)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#4960B2] hover:bg-[#4960B2] hover:text-white font-bold text-xs transition shadow-2xs"
                                                    title="Download Invoice PDF"
                                                >
                                                    <FiDownload size={13} /> Invoice
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <FaReceipt className="mx-auto text-gray-300 mb-2" size={26} />
                        <p className="text-xs font-semibold text-gray-600">No transactions recorded yet</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Paid subscription payments will appear here with downloadable invoices.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;

