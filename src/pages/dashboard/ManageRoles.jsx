import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FiPlus, FiEdit2, FiTrash2, FiShield, FiCheck, FiX } from 'react-icons/fi';

const ManageRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: '' });
    const [confirmDelete, setConfirmDelete] = useState(null);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/roles`, { headers });
            setRoles(res.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setMessage({ text: 'Failed to load roles', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const openAddForm = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: '' });
        setShowForm(true);
    };

    const openEditForm = (role) => {
        setEditingRole(role._id);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: (role.permissions || []).join(', '),
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showMsg('Role name is required', 'error');
            return;
        }

        const payload = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            permissions: formData.permissions
                .split(',')
                .map((p) => p.trim())
                .filter(Boolean),
        };

        try {
            if (editingRole) {
                await axios.put(`${API_URL}/api/roles/${editingRole}`, payload, { headers });
                showMsg('Role updated successfully', 'success');
            } else {
                await axios.post(`${API_URL}/api/roles`, payload, { headers });
                showMsg('Role created successfully', 'success');
            }
            setShowForm(false);
            setEditingRole(null);
            fetchRoles();
        } catch (err) {
            showMsg(err.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/roles/${id}`, { headers });
            showMsg('Role deleted successfully', 'success');
            setConfirmDelete(null);
            fetchRoles();
        } catch (err) {
            showMsg(err.response?.data?.message || 'Failed to delete role', 'error');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: '' });
    };

    return (
        <div className="pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D1C44] tracking-tight">Manage Roles</h1>
                    <p className="text-gray-400 text-sm mt-1">Define roles and permissions for your platform</p>
                </div>
                <button
                    onClick={openAddForm}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4960B2] text-white font-bold text-sm shadow-[0_4px_16px_rgba(73,96,178,0.3)] hover:bg-[#3b4f98] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                    <FiPlus size={16} />
                    Add Role
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-bold text-[#0D1C44] mb-4">
                        {editingRole ? 'Edit Role' : 'Create New Role'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                    Role Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. editor, agent, moderator"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] focus:bg-white text-sm font-medium outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                    Permissions (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={formData.permissions}
                                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                                    placeholder="e.g. properties.view, properties.manage"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] focus:bg-white text-sm font-medium outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this role..."
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#4960B2] focus:bg-white text-sm font-medium outline-none transition-all resize-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4960B2] text-white font-bold text-sm hover:bg-[#3b4f98] transition-all cursor-pointer"
                            >
                                <FiCheck size={16} />
                                {editingRole ? 'Update Role' : 'Create Role'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                <FiX size={16} />
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Roles Grid */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">Loading roles...</div>
            ) : roles.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100">No roles found</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                        <div
                            key={role._id}
                            className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-5 hover:shadow-lg transition-shadow group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        role.isSystem ? 'bg-purple-100' : 'bg-[#4960B2]/10'
                                    }`}>
                                        <FiShield className={`text-lg ${role.isSystem ? 'text-purple-600' : 'text-[#4960B2]'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#0D1C44] capitalize">{role.name}</h3>
                                        {role.isSystem && (
                                            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md uppercase">
                                                System
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!role.isSystem && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditForm(role)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#4960B2] hover:bg-[#4960B2]/10 transition-all cursor-pointer"
                                        >
                                            <FiEdit2 size={14} />
                                        </button>
                                        {confirmDelete === role._id ? (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleDelete(role._id)}
                                                    className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(null)}
                                                    className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDelete(role._id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {role.description && (
                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{role.description}</p>
                            )}

                            {/* Permissions */}
                            {role.permissions && role.permissions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {role.permissions.map((perm, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 rounded-md bg-gray-50 text-[10px] font-semibold text-gray-500 border border-gray-100"
                                        >
                                            {perm}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Status */}
                            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    role.status ? 'text-emerald-500' : 'text-gray-400'
                                }`}>
                                    {role.status ? '● Active' : '● Inactive'}
                                </span>
                                <span className="text-[10px] text-gray-300">
                                    {new Date(role.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageRoles;
