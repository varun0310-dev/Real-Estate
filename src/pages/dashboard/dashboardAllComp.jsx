import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import SuperAdminDashboard from '../../components/dashboard/Dashboard/SuperAdminDashboard';
import SellerDashboard from '../../components/dashboard/Dashboard/SellerDashboard';
import BuyerDashboard from '../../components/dashboard/Dashboard/BuyerDashboard';

const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-28 bg-gray-200 rounded-2xl w-full" />

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-white border border-gray-100">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-xl" />
            ))}
        </div>

        {/* 2-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-5">
                <div className="h-72 bg-white rounded-2xl border border-gray-100 p-5" />
                <div className="h-72 bg-white rounded-2xl border border-gray-100 p-5" />
            </div>
            <div className="lg:col-span-5 space-y-5">
                <div className="h-72 bg-white rounded-2xl border border-gray-100 p-5" />
                <div className="h-72 bg-white rounded-2xl border border-gray-100 p-5" />
            </div>
        </div>
    </div>
);

const DashboardAllComp = () => {
    const { profile } = useOutletContext() || {};
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await axios.get(`${API_URL}/api/dashboard/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDashboardData(res.data);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError(err.response?.data?.message || 'Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [profile]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-red-100 text-center max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Failed to load dashboard</h3>
                <p className="text-xs text-gray-500 mb-4">{error}</p>
                <button
                    onClick={fetchStats}
                    className="px-4 py-2 bg-[#4960B2] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#3b4f98] transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Determine role: superadmin > seller > buyer
    const isSuperAdmin = profile?.userType === 'superadmin' || profile?.role === 'superadmin' || dashboardData?.role === 'superadmin';
    const isSeller = profile?.userType === 'seller' || dashboardData?.role === 'seller';

    if (isSuperAdmin) {
        return <SuperAdminDashboard data={dashboardData} profile={profile} />;
    }

    if (isSeller) {
        return <SellerDashboard data={dashboardData} profile={profile} />;
    }

    return <BuyerDashboard data={dashboardData} profile={profile} />;
};

export default DashboardAllComp;
