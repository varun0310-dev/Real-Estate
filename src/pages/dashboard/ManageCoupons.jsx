import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
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

    // Form states
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        sellerId: '',
        discountType: 'fixed',
        discountValue: ''
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
            setSellers(res.data.sellers);
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
                title: coupon.title,
                sellerId: coupon.sellerId?._id || coupon.sellerId,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            });
        } else {
            setEditId(null);
            setFormData({
                title: '',
                sellerId: '',
                discountType: 'fixed',
                discountValue: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Client-side validation
        if (!formData.title.trim()) return toast.error('Coupon title is required');
        if (!formData.sellerId) return toast.error('Please select a seller');
        if (!formData.discountValue || formData.discountValue <= 0) return toast.error('Discount value must be greater than 0');
        if (formData.discountType === 'percentage' && formData.discountValue > 100) return toast.error('Percentage discount cannot exceed 100');

        try {
            if (editId) {
                await axios.put(`${API_URL}/api/admin/coupons/${editId}`, formData, { headers });
                toast.success('Coupon updated successfully');
            } else {
                await axios.post(`${API_URL}/api/admin/coupons`, formData, { headers });
                toast.success('Coupon created successfully');
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
        <div className="pt-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D1C44] tracking-tight">Coupon Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage discount coupons for sellers.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#4960B2] text-white px-4 py-2 rounded-xl font-semibold shadow-md shadow-[#4960B2]/20 hover:bg-[#3a4d91] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                    <FiPlus size={18} /> Add New Coupon
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Seller</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Usage</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-400">Loading coupons...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-gray-400">No coupons found.</td></tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#0D1C44] bg-gray-100 px-3 py-1 rounded-md inline-block tracking-wider">
                                                {coupon.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-800">{coupon.sellerId?.name || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{coupon.sellerId?.companyName || coupon.sellerId?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-emerald-600">
                                                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${coupon.usageCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {coupon.usageCount} {coupon.usageCount === 1 ? 'use' : 'uses'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(coupon._id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                                                    coupon.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                }`}
                                            >
                                                {coupon.status === 'active' ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                                                {coupon.status === 'active' ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(coupon)}
                                                    disabled={coupon.usageCount > 0}
                                                    title={coupon.usageCount > 0 ? "Cannot edit a coupon in use" : "Edit Coupon"}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                        coupon.usageCount > 0 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer'
                                                    }`}
                                                >
                                                    <FiEdit2 size={14} />
                                                </button>

                                                <div className="relative">
                                                    <button
                                                        onClick={() => handleDeleteClick(coupon)}
                                                        disabled={coupon.usageCount > 0}
                                                        title={coupon.usageCount > 0 ? "Cannot delete a coupon in use" : "Delete Coupon"}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                                            coupon.usageCount > 0
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                                            : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer'
                                                        }`}
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30">
                            <h2 className="text-xl font-bold text-[#0D1C44]">
                                {editId ? 'Edit Coupon' : 'Create New Coupon'}
                            </h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 cursor-pointer transition-colors">
                                <FiX size={18} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Coupon Title (Code) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. SUMMER20"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 transition-all font-bold tracking-wider uppercase text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign to Seller *</label>
                                <select
                                    required
                                    value={formData.sellerId}
                                    onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 transition-all text-gray-800"
                                >
                                    <option value="">Select a seller...</option>
                                    {sellers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Discount Type *</label>
                                <div className="flex gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <div className={`px-4 py-3 border-2 rounded-xl text-center transition-all ${formData.discountType === 'fixed' ? 'border-[#4960B2] bg-blue-50 text-[#4960B2]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                            <input 
                                                type="radio" 
                                                name="discountType" 
                                                value="fixed"
                                                checked={formData.discountType === 'fixed'}
                                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                                className="hidden"
                                            />
                                            <span className="font-bold">Fixed (₹)</span>
                                        </div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <div className={`px-4 py-3 border-2 rounded-xl text-center transition-all ${formData.discountType === 'percentage' ? 'border-[#4960B2] bg-blue-50 text-[#4960B2]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                            <input 
                                                type="radio" 
                                                name="discountType" 
                                                value="percentage"
                                                checked={formData.discountType === 'percentage'}
                                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                                className="hidden"
                                            />
                                            <span className="font-bold">Percentage (%)</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Discount Value *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">{formData.discountType === 'fixed' ? '₹' : '%'}</span>
                                    </div>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={formData.discountType === 'percentage' ? "100" : undefined}
                                        placeholder="Enter amount"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#4960B2] focus:ring-2 focus:ring-[#4960B2]/20 transition-all text-gray-800 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-[#4960B2] text-white font-bold shadow-lg shadow-[#4960B2]/30 hover:bg-[#3a4d91] hover:-translate-y-0.5 transition-all cursor-pointer">
                                    {editId ? 'Save Changes' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Confirm Delete"
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
