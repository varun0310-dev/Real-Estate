import React, { useState, useEffect } from 'react';
import { HiArrowLeft } from 'react-icons/hi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../../config';

const RoleForm = ({ onBack, roleToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (roleToEdit) {
            setName(roleToEdit.name);
            setDescription(roleToEdit.description || '');
        }
    }, [roleToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: name.trim(),
            description: description.trim(),
        };

        try {
            const token = localStorage.getItem('token');
            if (roleToEdit) {
                await axios.put(`${API_URL}/api/roles/${roleToEdit._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Role updated successfully');
            } else {
                await axios.post(`${API_URL}/api/roles`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Role created successfully');
            }
            onBack();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving role');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#f5f6fa] min-h-screen">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 bg-white rounded-lg shadow-sm text-gray-600 hover:text-[#3f51b5] transition cursor-pointer"
                >
                    <HiArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-[#1e1e2d]">
                    {roleToEdit ? 'Edit Role' : 'Add New Role'}
                </h2>
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            Role Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. editor, moderator, agent"
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#3f51b5] focus:bg-white text-sm font-semibold text-gray-700 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe what this role is for..."
                            className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-transparent focus:border-[#3f51b5] focus:bg-white text-sm font-semibold text-gray-700 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#3f51b5] text-white py-3 rounded-xl font-bold text-sm shadow-[0_4px_16px_rgba(63,81,181,0.2)] hover:bg-[#334296] hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Saving...' : roleToEdit ? 'Update Role' : 'Create Role'}
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoleForm;
