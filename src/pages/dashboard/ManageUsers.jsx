import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiSearch, FiChevronDown, FiTrash2, FiShield, FiUserCheck, FiUserX, FiUsers } from 'react-icons/fi';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [editingRole, setEditingRole] = useState(null); // userId being edited
    const [confirmDelete, setConfirmDelete] = useState(null); // userId to delete

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchUsers();
    }, [page, filterRole, filterStatus]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchUsers();
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15, search, userType: filterRole, status: filterStatus };
            const res = await axios.get(`${API_URL}/api/admin/users`, { headers, params });
            setUsers(res.data.users);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error('Error fetching users:', err);
            setMessage({ text: 'Failed to load users', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`${API_URL}/api/admin/users/${userId}/role`, { userType: newRole }, { headers });
            setMessage({ text: `Role updated to ${newRole}`, type: 'success' });
            setEditingRole(null);
            fetchUsers();
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to update role', type: 'error' });
        }
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await axios.put(`${API_URL}/api/admin/users/${userId}/status`, { status: !currentStatus }, { headers });
            setMessage({ text: `User ${!currentStatus ? 'activated' : 'deactivated'}`, type: 'success' });
            fetchUsers();
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to update status', type: 'error' });
        }
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleDelete = async (userId) => {
        try {
            await axios.delete(`${API_URL}/api/admin/users/${userId}`, { headers });
            setMessage({ text: 'User deleted successfully', type: 'success' });
            setConfirmDelete(null);
            fetchUsers();
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to delete user', type: 'error' });
        }
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const getRoleBadge = (userType) => {
        const styles = {
            superadmin: 'bg-purple-100 text-purple-700 border-purple-200',
            seller: 'bg-blue-100 text-blue-700 border-blue-200',
            buyer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
        return styles[userType] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    return (
        <div className="pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D1C44] tracking-tight">Manage Users</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {total} user{total !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-[#4960B2]/10 flex items-center justify-center">
                        <FiUsers className="text-[#4960B2] text-lg" />
                    </div>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-4 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px]">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] focus:bg-white text-sm font-medium outline-none transition-all"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={filterRole}
                        onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] text-sm font-medium outline-none cursor-pointer appearance-none min-w-[140px]"
                    >
                        <option value="all">All Roles</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] text-sm font-medium outline-none cursor-pointer appearance-none min-w-[140px]"
                    >
                        <option value="all">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading users...</div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No users found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100">
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                    <th className="text-center px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                                    <th className="text-center px-6 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        {/* User */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#4960B2]/10 flex items-center justify-center text-[#4960B2] font-bold text-sm flex-shrink-0">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800">{user.name} {user.lastname || ''}</div>
                                                    {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>

                                        {/* Role */}
                                        <td className="px-6 py-4">
                                            {editingRole === user._id ? (
                                                <select
                                                    autoFocus
                                                    defaultValue={user.userType}
                                                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                    onBlur={() => setEditingRole(null)}
                                                    className="px-3 py-1.5 rounded-lg border border-[#4960B2] text-sm font-medium outline-none cursor-pointer"
                                                >
                                                    <option value="buyer">Buyer</option>
                                                    <option value="seller">Seller</option>
                                                    <option value="superadmin">Superadmin</option>
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingRole(user._id)}
                                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer hover:opacity-80 transition-opacity ${getRoleBadge(user.userType)}`}
                                                >
                                                    {user.userType?.toUpperCase()}
                                                    <FiChevronDown size={12} />
                                                </button>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(user._id, user.status)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                                    user.status
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-500 hover:bg-red-100'
                                                }`}
                                                title={user.status ? 'Click to deactivate' : 'Click to activate'}
                                            >
                                                {user.status ? <FiUserCheck size={13} /> : <FiUserX size={13} />}
                                                {user.status ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>

                                        {/* Joined */}
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-center">
                                            {confirmDelete === user._id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(user._id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                                    title="Delete user"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <span className="text-sm text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl bg-gray-50 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 rounded-xl bg-[#4960B2] text-white text-sm font-semibold hover:bg-[#3b4f98] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;
