import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import {
    FiSearch, FiEdit2, FiTrash2, FiPlus, FiX, FiCheckCircle,
    FiXCircle, FiUsers, FiTag, FiAward, FiInfo, FiLayers, FiCalendar
} from 'react-icons/fi';
import { FaTrashAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/dashboard/Common/ConfirmationModal';

const ManageCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState(null);
    const [viewingRedemptionsCoupon, setViewingRedemptionsCoupon] = useState(null);

    // Form states
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        sellerId: '',
        couponType: 'referral',
        discountType: 'fixed',
        discountValue: '',
        applicablePlans: ['standard', 'premium'],
        minPurchaseAmount: '',
        maxUses: '',
        maxUsesPerSeller: 1,
        expiresAt: '',
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchCoupons();
        fetchSellers();
    }, [page]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/admin/coupons?page=${page}&limit=10`, { headers });
            setCoupons(res.data.coupons);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error('Error fetching coupons:', err);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const fetchSellers = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/admin/coupons/sellers`, { headers });
            setSellers(res.data.sellers || []);
        } catch (err) {
            console.error('Error fetching sellers:', err);
        }
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            if (coupon.usageCount > 0) {
                toast.error('Cannot edit a coupon that is already in use');
                return;
            }
            setEditId(coupon._id);
            setFormData({
                title: coupon.title || '',
                sellerId: coupon.sellerId?._id || coupon.sellerId || '',
                couponType: coupon.couponType || 'referral',
                discountType: coupon.discountType || 'fixed',
                discountValue: coupon.discountValue ?? '',
                applicablePlans: coupon.applicablePlans && coupon.applicablePlans.length > 0
                    ? coupon.applicablePlans
                    : ['standard', 'premium'],
                minPurchaseAmount: coupon.minPurchaseAmount || '',
                maxUses: coupon.maxUses || '',
                maxUsesPerSeller: coupon.maxUsesPerSeller || 1,
                expiresAt: coupon.expiresAt
                    ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
                    : '',
            });
        } else {
            setEditId(null);
            setFormData({
                title: '',
                sellerId: '',
                couponType: 'referral',
                discountType: 'fixed',
                discountValue: '',
                applicablePlans: ['standard', 'premium'],
                minPurchaseAmount: '',
                maxUses: '',
                maxUsesPerSeller: 1,
                expiresAt: '',
            });
        }
        setIsModalOpen(true);
    };

    const togglePlanSelection = (planKey) => {
        setFormData((prev) => {
            const exists = prev.applicablePlans.includes(planKey);
            const updated = exists
                ? prev.applicablePlans.filter((p) => p !== planKey)
                : [...prev.applicablePlans, planKey];
            return {
                ...prev,
                applicablePlans: updated.length === 0 ? ['standard', 'premium'] : updated,
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        if (!formData.title.trim()) return toast.error('Coupon code is required');
        if (!formData.sellerId) return toast.error('Please assign a referrer seller');
        if (!formData.discountValue || Number(formData.discountValue) <= 0) {
            return toast.error('Discount value must be greater than 0');
        }
        if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100) {
            return toast.error('Percentage discount cannot exceed 100%');
        }

        try {
            const payload = {
                title: formData.title.trim().toUpperCase(),
                sellerId: formData.sellerId,
                couponType: formData.couponType,
                discountType: formData.discountType,
                discountValue: Number(formData.discountValue),
                applicablePlans: formData.applicablePlans,
                minPurchaseAmount: formData.minPurchaseAmount ? Number(formData.minPurchaseAmount) : 0,
                maxUses: formData.maxUses ? Number(formData.maxUses) : null,
                maxUsesPerSeller: formData.maxUsesPerSeller ? Number(formData.maxUsesPerSeller) : 1,
                expiresAt: formData.expiresAt || null,
            };

            if (editId) {
                await axios.put(`${API_URL}/api/admin/coupons/${editId}`, payload, { headers });
                toast.success('Coupon updated successfully');
            } else {
                await axios.post(`${API_URL}/api/admin/coupons`, payload, { headers });
                toast.success('Referral coupon created successfully');
            }
            setIsModalOpen(false);
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'An error occurred');
        }
    };

    const handleDeleteClick = (coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!couponToDelete) return;
        try {
            await axios.delete(`${API_URL}/api/admin/coupons/${couponToDelete._id}`, { headers });
            toast.success('Coupon deleted successfully');
            setIsDeleteModalOpen(false);
            setCouponToDelete(null);
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete coupon');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await axios.patch(`${API_URL}/api/admin/coupons/${id}/status`, {}, { headers });
            toast.success('Coupon status updated');
            fetchCoupons();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    return (
        <div className="pt-4 max-w-7xl mx-auto px-2 sm:px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-[#0D1C44] tracking-tight flex items-center gap-2">
                        <FiTag className="text-[#4960B2]" /> Coupon & Referral Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create referral coupons for sellers to share with other sellers subscribing to packages.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#4960B2] text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-[#4960B2]/20 hover:bg-[#3a4d91] hover:-translate-y-0.5 transition-all cursor-pointer text-sm w-fit"
                >
                    <FiPlus size={18} /> Create Referral Coupon
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Coupon Code</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Referrer (Seller)</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Applicable Packages</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Usage & Limits</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-gray-400">
                                        <div className="animate-spin w-6 h-6 border-2 border-[#4960B2] border-t-transparent rounded-full mx-auto mb-2" />
                                        Loading coupons...
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-gray-400">
                                        No coupons found. Click "Create Referral Coupon" to add one.
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon._id} className="hover:bg-blue-50/20 transition-colors">
                                        {/* Code */}
                                        <td className="px-5 py-4">
                                            <div className="font-mono font-black text-[#0D1C44] bg-gray-100 px-3 py-1 rounded-lg inline-flex items-center gap-1.5 border border-gray-200 tracking-wider">
                                                <FiTag className="text-[#4960B2]" size={13} />
                                                {coupon.title}
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                                                {coupon.couponType === 'general' ? 'General' : 'Referral Program'}
                                            </div>
                                        </td>

                                        {/* Referrer Seller */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#4960B2] flex items-center justify-center font-bold text-xs shrink-0">
                                                    {(coupon.sellerId?.name || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800 flex items-center gap-1">
                                                        {coupon.sellerId?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{coupon.sellerId?.email}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Discount */}
                                        <td className="px-5 py-4">
                                            <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-block text-xs">
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.discountValue}% OFF`
                                                    : `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`}
                                            </span>
                                            {coupon.minPurchaseAmount > 0 && (
                                                <div className="text-[11px] text-gray-400 mt-1">
                                                    Min. ₹{coupon.minPurchaseAmount.toLocaleString('en-IN')}
                                                </div>
                                            )}
                                        </td>

                                        {/* Applicable Packages */}
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(!coupon.applicablePlans || coupon.applicablePlans.length === 0 || coupon.applicablePlans.length >= 2) ? (
                                                    <span className="bg-indigo-50 text-[#4960B2] border border-indigo-100 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                                        All Paid Packages
                                                    </span>
                                                ) : (
                                                    coupon.applicablePlans.map((p) => (
                                                        <span
                                                            key={p}
                                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md capitalize border ${
                                                                p === 'premium'
                                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    : 'bg-blue-50 text-[#4960B2] border-blue-200'
                                                            }`}
                                                        >
                                                            {p}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>

                                        {/* Usage & Limits */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        coupon.usageCount > 0
                                                            ? 'bg-blue-50 text-[#4960B2] border border-blue-200'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {coupon.usageCount}
                                                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ''} {coupon.usageCount === 1 ? 'use' : 'uses'}
                                                </span>
                                                {coupon.usedBy && coupon.usedBy.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingRedemptionsCoupon(coupon)}
                                                        className="text-xs text-[#4960B2] hover:underline font-semibold"
                                                        title="View redemptions list"
                                                    >
                                                        View ({coupon.usedBy.length})
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-1">
                                                {coupon.maxUsesPerSeller || 1}x per referred seller
                                            </div>
                                        </td>

                                        {/* Expiry */}
                                        <td className="px-5 py-4 text-xs text-gray-600">
                                            {coupon.expiresAt ? (
                                                <span className={new Date(coupon.expiresAt) < new Date() ? 'text-red-500 font-semibold' : ''}>
                                                    {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">Never</span>
                                            )}
                                        </td>

                                        {/* Status Toggle */}
                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(coupon._id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                                    coupon.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                }`}
                                            >
                                                {coupon.status === 'active' ? <FiCheckCircle size={13} /> : <FiXCircle size={13} />}
                                                {coupon.status === 'active' ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(coupon)}
                                                    disabled={coupon.usageCount > 0}
                                                    title={coupon.usageCount > 0 ? 'Cannot edit coupon in use' : 'Edit Coupon'}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                        coupon.usageCount > 0
                                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                            : 'bg-blue-50 text-blue-600 hover:bg-[#4960B2] hover:text-white cursor-pointer'
                                                    }`}
                                                >
                                                    <FiEdit2 size={13} />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(coupon)}
                                                    disabled={coupon.usageCount > 0}
                                                    title={coupon.usageCount > 0 ? 'Cannot delete coupon in use' : 'Delete Coupon'}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                        coupon.usageCount > 0
                                                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer'
                                                    }`}
                                                >
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} coupons
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[92vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-[#0D1C44]">
                                    {editId ? 'Edit Referral Coupon' : 'Create Referral Coupon'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Configure referral discount code for sellers subscribing to packages.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer transition-colors"
                            >
                                <FiX size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            {/* Code */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                                    Coupon Code (Title) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. SELLER20, REFFERAL50"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 transition-all font-mono font-bold tracking-wider uppercase text-gray-800 text-sm"
                                />
                            </div>

                            {/* Referrer Seller */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5 flex items-center justify-between">
                                    <span>Referrer Seller (Beneficiary Partner) *</span>
                                    <span className="text-[11px] text-gray-400 font-normal">Who shares this coupon</span>
                                </label>
                                <select
                                    required
                                    value={formData.sellerId}
                                    onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 transition-all text-gray-800 text-sm"
                                >
                                    <option value="">Select a seller...</option>
                                    {sellers.map((s) => (
                                        <option key={s._id} value={s._id}>
                                            {s.name} ({s.email}) {s.companyName ? `• ${s.companyName}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    💡 <strong>Referral rule:</strong> Any other seller can apply this coupon to get a discount. The referrer cannot apply it to themselves.
                                </p>
                            </div>

                            {/* Coupon Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <label className="cursor-pointer">
                                    <input
                                        type="radio"
                                        name="couponType"
                                        value="referral"
                                        checked={formData.couponType === 'referral'}
                                        onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                                        className="hidden"
                                    />
                                    <div
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                                            formData.couponType === 'referral'
                                                ? 'border-[#4960B2] bg-blue-50 text-[#4960B2]'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-bold text-xs">Referral Program</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">Usable by other sellers</div>
                                    </div>
                                </label>

                                <label className="cursor-pointer">
                                    <input
                                        type="radio"
                                        name="couponType"
                                        value="general"
                                        checked={formData.couponType === 'general'}
                                        onChange={(e) => setFormData({ ...formData, couponType: e.target.value })}
                                        className="hidden"
                                    />
                                    <div
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                                            formData.couponType === 'general'
                                                ? 'border-[#4960B2] bg-blue-50 text-[#4960B2]'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-bold text-xs">General Coupon</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">Open to all sellers</div>
                                    </div>
                                </label>
                            </div>

                            {/* Discount Type & Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Discount Type *</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discountType: 'fixed' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                                                formData.discountType === 'fixed'
                                                    ? 'bg-[#4960B2] text-white border-[#4960B2]'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}
                                        >
                                            Fixed (₹)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, discountType: 'percentage' })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                                                formData.discountType === 'percentage'
                                                    ? 'bg-[#4960B2] text-white border-[#4960B2]'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}
                                        >
                                            Percent (%)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">Discount Value *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                                            {formData.discountType === 'fixed' ? '₹' : '%'}
                                        </span>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max={formData.discountType === 'percentage' ? 100 : undefined}
                                            placeholder="e.g. 500"
                                            value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4960B2] text-sm font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Applicable Packages */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                                    Applicable Packages *
                                </label>
                                <div className="flex gap-3">
                                    {['standard', 'premium'].map((planKey) => {
                                        const isSelected = formData.applicablePlans.includes(planKey);
                                        return (
                                            <button
                                                key={planKey}
                                                type="button"
                                                onClick={() => togglePlanSelection(planKey)}
                                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                    isSelected
                                                        ? 'bg-blue-50 border-[#4960B2] text-[#4960B2]'
                                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#4960B2]' : 'bg-gray-300'}`} />
                                                {planKey.charAt(0).toUpperCase() + planKey.slice(1)} Package
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    (Coupons automatically do not apply to the free Basic package).
                                </p>
                            </div>

                            {/* Limits & Conditions Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                                        Min Order (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0 (None)"
                                        value={formData.minPurchaseAmount}
                                        onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                                        Total Uses Limit
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Unlimited"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                                        Uses Per Seller
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.maxUsesPerSeller}
                                        onChange={(e) => setFormData({ ...formData, maxUsesPerSeller: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                                    />
                                </div>
                            </div>

                            {/* Expiry date */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5">
                                    Expiration Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Leave blank for no expiration date.</p>
                            </div>

                            {/* Buttons */}
                            <div className="pt-3 flex gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-[#4960B2] text-white font-bold shadow-lg shadow-[#4960B2]/30 hover:bg-[#3a4d91] hover:-translate-y-0.5 transition-all cursor-pointer text-sm"
                                >
                                    {editId ? 'Save Changes' : 'Create Referral Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Redemptions List Modal */}
            {viewingRedemptionsCoupon && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-[#0D1C44] text-base flex items-center gap-2">
                                    <FiTag className="text-[#4960B2]" /> Redemptions for {viewingRedemptionsCoupon.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Referrer: {viewingRedemptionsCoupon.sellerId?.name || 'Seller'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingRedemptionsCoupon(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto divide-y divide-gray-100">
                            {(!viewingRedemptionsCoupon.usedBy || viewingRedemptionsCoupon.usedBy.length === 0) ? (
                                <p className="text-sm text-gray-400 text-center py-6">No redemptions yet.</p>
                            ) : (
                                viewingRedemptionsCoupon.usedBy.map((entry, idx) => (
                                    <div key={idx} className="py-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{entry.seller?.name || 'Seller'}</p>
                                            <p className="text-xs text-gray-400">{entry.seller?.email || '—'}</p>
                                            <span className="inline-block mt-1 bg-blue-50 text-[#4960B2] text-[10px] font-bold px-2 py-0.5 rounded capitalize">
                                                {entry.plan} package • {entry.billingCycle || 'monthly'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-emerald-600">
                                                - ₹{(entry.discountAmount || 0).toLocaleString('en-IN')}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {new Date(entry.usedAt).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Confirm Delete Coupon"
                message={`Are you sure you want to delete the coupon "${couponToDelete?.title}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                confirmText="Delete Now"
                confirmColor="bg-red-600 hover:bg-red-700"
                icon={<FaTrashAlt className="h-6 w-6 text-red-600" />}
                iconBg="bg-red-100"
            />
        </div>
    );
};

export default ManageCoupons;
