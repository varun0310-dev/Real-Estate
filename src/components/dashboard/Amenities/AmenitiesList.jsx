import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import axios from 'axios';
import AmenityForm from './AmenityForm';
import ConfirmationModal from '../Common/ConfirmationModal';
import toast from 'react-hot-toast';
import { API_URL } from '../../../config';
import { useOutletContext } from 'react-router-dom';

const AmenitiesList = () => {
    const { profile } = useOutletContext();
    const [amenities, setAmenities] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAddForm, setShowAddForm] = useState(false);
    const [amenityToEdit, setAmenityToEdit] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const itemsPerPage = 10;

    const fetchAmenities = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/amenities?page=${page}&limit=${itemsPerPage}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAmenities(response.data.amenities || response.data);
            setTotalPages(response.data.totalPages || 1);
            setCurrentPage(response.data.currentPage || 1);
        } catch (err) {
            console.error('Error fetching amenities:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAmenities(currentPage);
    }, [currentPage]);

    const handleEdit = (amenity) => {
        setAmenityToEdit(amenity);
        setShowAddForm(true);
    };

    const handleDeleteClick = (id) => {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/amenities/${idToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Amenity deleted successfully');
            fetchAmenities(currentPage);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error deleting amenity');
        } finally {
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBackWithFetch = () => {
        setShowAddForm(false);
        setAmenityToEdit(null);
        fetchAmenities(currentPage);
    };

    if (showAddForm) {
        return <AmenityForm onBack={handleBackWithFetch} amenityToEdit={amenityToEdit} />;
    }

    const isSuperAdmin = profile?.userType === 'superadmin' || profile?.role === 'superadmin';

    return (
        <div className="p-6 bg-[#f5f6fa] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#1e1e2d]">Property Amenities</h2>
                <button
                    className="bg-[#3f51b5] text-white px-4 py-2 rounded hover:bg-[#334296] transition cursor-pointer"
                    onClick={() => setShowAddForm(true)}
                >
                    Add New Amenity
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="text-[#1e1e2d] bg-white border-b border-gray-300">
                        <tr>
                            <th className="p-4 font-semibold uppercase tracking-wider text-center w-16">S.no.</th>
                            <th className="p-4 font-semibold uppercase tracking-wider">Name</th>
                            {isSuperAdmin && <th className="p-4 font-bold tracking-tight text-[#3f51b5]">Added By</th>}
                            <th className="p-4 font-semibold uppercase tracking-wider">Description</th>
                            <th className="p-4 font-semibold uppercase tracking-wider text-center">Date Added</th>
                            <th className="p-4 font-semibold uppercase tracking-wider text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {loading ? (
                            <tr><td colSpan={isSuperAdmin ? 6 : 5} className="p-10 text-center text-gray-400 font-medium tracking-tight">Loading...</td></tr>
                        ) : amenities.length > 0 ? (
                            amenities.map((amenity, index) => (
                                <tr key={amenity._id} className="hover:bg-gray-50 transition border-b border-gray-200">
                                    <td className="p-4 text-center text-gray-500 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="p-4 font-bold text-[#1e1e2d] whitespace-nowrap">{amenity.name}</td>
                                    {isSuperAdmin && (
                                        <td className="p-4 font-medium text-gray-700">
                                            {amenity.seller ? (
                                                <div className="flex flex-col min-w-[120px]">
                                                    <span className="font-bold text-gray-900 leading-tight">{amenity.seller.name} {amenity.seller.lastname || ''}</span>
                                                    <span className="text-[11px] text-gray-400 font-normal tracking-tight">{amenity.seller.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">System User</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="p-4 text-gray-600 max-w-sm truncate">{amenity.description || 'N/A'}</td>
                                    <td className="p-4 text-gray-600 text-center font-medium tracking-tighter italic">{amenity.createdAt ? new Date(amenity.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(amenity)}
                                                className="bg-[#e0e7ff] text-[#5b73e8] p-2 rounded hover:bg-[#d0dbfc] transition cursor-pointer shadow-sm"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(amenity._id)}
                                                className="bg-[#ffe2e5] text-[#f46a6a] p-2 rounded hover:bg-[#fcd1d6] transition cursor-pointer shadow-sm"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={isSuperAdmin ? 6 : 5} className="p-10 text-center text-gray-400 font-medium">No amenities found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                    >
                        <HiChevronLeft size={20} />
                    </button>

                    {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-10 h-10 border text-sm font-medium rounded-md cursor-pointer ${currentPage === i + 1
                                ? 'bg-[#3f51b5] text-white'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                    >
                        <HiChevronRight size={20} />
                    </button>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Amenity"
                message="Are you sure you want to delete this amenity? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
};

export default AmenitiesList;
