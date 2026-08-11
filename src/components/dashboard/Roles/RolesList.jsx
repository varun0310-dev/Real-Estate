import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaShieldAlt } from 'react-icons/fa';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import axios from 'axios';
import RoleForm from './RoleForm';
import ConfirmationModal from '../Common/ConfirmationModal';
import toast from 'react-hot-toast';
import { API_URL } from '../../../config';
import { useOutletContext } from 'react-router-dom';

const RolesList = () => {
    const { profile } = useOutletContext();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoles(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleEdit = (role) => {
        setRoleToEdit(role);
        setShowAddForm(true);
    };

    const handleDeleteClick = (id) => {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/roles/${idToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error deleting role');
        } finally {
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBack = () => {
        setShowAddForm(false);
        setRoleToEdit(null);
        fetchRoles();
    };

    if (showAddForm) {
        return <RoleForm onBack={handleBack} roleToEdit={roleToEdit} />;
    }

    return (
        <div className="p-6 bg-[#f5f6fa] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[#1e1e2d]">Roles management</h2>
                    <p className="text-sm text-gray-400 mt-1">Configure user roles and system permissions</p>
                </div>
                <button
                    className="bg-[#3f51b5] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_16px_rgba(63,81,181,0.2)] hover:bg-[#334296] transition cursor-pointer"
                    onClick={() => setShowAddForm(true)}
                >
                    Add New Role
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-bold text-gray-400 uppercase tracking-wider text-center w-16">S.no.</th>
                            <th className="p-4 font-bold text-gray-400 uppercase tracking-wider">Role Name</th>
                            <th className="p-4 font-bold text-gray-400 uppercase tracking-wider">Description</th>
                            <th className="p-4 font-bold text-gray-400 uppercase tracking-wider text-center">Type</th>
                            <th className="p-4 font-bold text-gray-400 uppercase tracking-wider text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400">Loading roles...</td></tr>
                        ) : roles.length > 0 ? (
                            roles.map((role, index) => (
                                <tr key={role._id} className="hover:bg-gray-50/50 transition border-b border-gray-50">
                                    <td className="p-4 text-center text-gray-400 font-medium">{index + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                role.isSystem ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                <FaShieldAlt size={14} />
                                            </div>
                                            <span className="font-bold text-[#1e1e2d] capitalize">{role.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 max-w-xs " title={role.description}>
                                        {role.description || <span className="text-gray-300 italic">No description</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            role.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {role.isSystem ? 'System' : 'Custom'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            {!role.isSystem ? (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(role)}
                                                        className="bg-[#e0e7ff] text-[#5b73e8] p-2 rounded-lg hover:bg-[#d0dbfc] transition cursor-pointer shadow-sm"
                                                        title="Edit Role"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(role._id)}
                                                        className="bg-[#ffe2e5] text-[#f46a6a] p-2 rounded-lg hover:bg-[#fcd1d6] transition cursor-pointer shadow-sm"
                                                        title="Delete Role"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-gray-300 italic text-xs">Read-only</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="p-12 text-center text-gray-400">No roles found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Role"
                message="Are you sure you want to delete this role? Users assigned to this role might lose access to certain features."
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default RolesList;
