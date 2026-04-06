import React, { useState, useEffect } from 'react'
import { FaEye, FaEdit, FaTrash } from 'react-icons/fa'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import AddNewProperty from './AddNewProperty'
import axios from 'axios'
import { API_URL } from '../../../config'
import ConfirmationModal from '../Common/ConfirmationModal'
import { FaTrashAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useOutletContext, useSearchParams } from 'react-router-dom'

const MyProperties = () => {
    const { profile } = useOutletContext()
    const [searchParams, setSearchParams] = useSearchParams()
    const [currentPage, setCurrentPage] = useState(1)
    const [showAddForm, setShowAddForm] = useState(searchParams.get('addNew') === 'true')
    const [properties, setProperties] = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [editingProperty, setEditingProperty] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [propertyToDelete, setPropertyToDelete] = useState(null)
    const itemsPerPage = 10

    const fetchProperties = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const res = await axios.get(`${API_URL}/api/properties/my-properties?page=${currentPage}&limit=${itemsPerPage}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const propertiesData = res.data.properties || (Array.isArray(res.data) ? res.data : [])
            setProperties(propertiesData)
            setTotalPages(res.data.pages || 1)
        } catch (error) {
            console.error('Error fetching properties:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            const token = localStorage.getItem('token')
            await axios.patch(`${API_URL}/api/properties/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(`Property marked as ${status} successfully`)
            fetchProperties()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating status')
        }
    }

    const handleDeleteClick = (property) => {
        setPropertyToDelete(property)
        setIsDeleteModalOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!propertyToDelete) return
        try {
            const token = localStorage.getItem('token')
            await axios.delete(`${API_URL}/api/properties/${propertyToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setIsDeleteModalOpen(false)
            fetchProperties()
            toast.success('Property deleted successfully')
        } catch (error) {
            console.error('Error deleting property:', error)
            toast.error('Error deleting property')
        }
    }

    useEffect(() => {
        if (!showAddForm && !editingProperty) {
            fetchProperties()
        }
    }, [currentPage, showAddForm, editingProperty])

    // Clear search param once form is shown
    useEffect(() => {
        if (searchParams.get('addNew') === 'true') {
            setShowAddForm(true)
            // Remove the param if you want, but it's fine for now.
        }
    }, [searchParams])

    const handleBack = () => {
        setShowAddForm(false)
        setEditingProperty(null)
        // Clear query params if redirecting back
        if (searchParams.get('addNew')) {
            setSearchParams({})
        }
    }

    if (showAddForm || editingProperty) {
        return <AddNewProperty 
                   onBack={handleBack} 
                   propertyToEdit={editingProperty}
               />
    }

    const isSuperAdmin = profile?.userType === 'superadmin' || profile?.role === 'superadmin';

    return (
        <div className="p-6 bg-[#f5f6fa] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#1e1e2d]">{isSuperAdmin ? 'Managed Properties' : 'My Properties'}</h2>
                <button
                    className="bg-[#3f51b5] text-white px-4 py-2 rounded hover:bg-[#334296] transition cursor-pointer"
                    onClick={() => setShowAddForm(true)} 
                >
                    Add New Property
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="text-[#1e1e2d] bg-[#f8f9fa] border-b border-gray-300 ">
                        <tr>
                            <th className="p-4 font-bold text-center w-16">S.no.</th>
                            <th className="p-4 font-bold">Properties photo & name</th>
                            {isSuperAdmin && <th className="p-4 font-bold text-[#3f51b5]">Added By</th>}
                            <th className="p-4 font-bold">Category</th>
                            <th className="p-4 font-bold">Type</th>
                            <th className="p-4 font-bold">Price</th>
                            <th className="p-4 font-bold">Date Added</th>
                            <th className="p-4 font-bold text-center">Status</th>
                            <th className="p-4 font-bold text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={isSuperAdmin ? 9 : 8} className="p-10 text-center text-gray-500 italic">Loading properties...</td></tr>
                        ) : properties.length === 0 ? (
                            <tr><td colSpan={isSuperAdmin ? 9 : 8} className="p-10 text-center text-gray-500">No properties found.</td></tr>
                        ) : (
                            properties.map((property, index) => (
                                <tr key={property._id} className="hover:bg-gray-50 transition border-b border-gray-100">
                                    <td className="p-4 text-center text-gray-500 font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={property.images && property.images.length > 0 ? `${API_URL}${property.images[0]}` : 'https://via.placeholder.com/150'}
                                                alt={property.title}
                                                className="w-10 h-10 object-cover rounded shadow-sm border border-gray-200"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                            />
                                            <span className="font-bold text-[#1e1e2d] whitespace-nowrap">{property.title}</span>
                                        </div>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="p-4 font-medium text-gray-700">
                                            {property.seller ? (
                                                <div className="flex flex-col min-w-[120px]">
                                                    <span className="font-bold text-gray-900 leading-tight">
                                                        {property.seller.name} {property.seller.lastname || ''}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-normal tracking-tight">{property.seller.email}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">System User</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="p-4 text-gray-600 font-medium whitespace-nowrap">{property.categoryId?.name || 'N/A'}</td>
                                    <td className="p-4">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-200 whitespace-nowrap">
                                            {property.propertyType || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[#1e1e2d] font-black">${property.price?.toLocaleString() || 0}</td>
                                    <td className="p-4 text-gray-600 whitespace-nowrap">{property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-4 text-center">
                                        {isSuperAdmin ? (
                                            <select
                                                value={property.propertyStatus || 'Pending'}
                                                onChange={(e) => handleStatusUpdate(property._id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border-2 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-sm ${
                                                    property.propertyStatus === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    property.propertyStatus === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Approved">Approve</option>
                                                <option value="Rejected">Reject</option>
                                            </select>
                                        ) : (
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border transition-all ${
                                                property.propertyStatus === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                property.propertyStatus === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                'bg-[#fffbeb] text-[#d97706] border-[#fef3c7]'
                                            }`}>
                                                {property.propertyStatus || 'Pending'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* <button className="bg-[#ccf6e4] text-[#34c38f] p-2 rounded hover:bg-[#b5e9d4] transition cursor-pointer shadow-sm">
                                                <FaEye size={12} />
                                            </button> */}
                                            <button 
                                                className="bg-[#e0e7ff] text-[#5b73e8] p-2 rounded hover:bg-[#d0dbfc] transition cursor-pointer shadow-sm"
                                                onClick={() => setEditingProperty(property)}
                                            >
                                                <FaEdit size={12} />
                                            </button>
                                            <button 
                                                className="bg-[#ffe2e5] text-[#f46a6a] p-2 rounded hover:bg-[#fcd1d6] transition cursor-pointer shadow-sm"
                                                onClick={() => handleDeleteClick(property)}
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                    >
                        <HiChevronLeft size={20} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 border text-sm font-medium rounded-md cursor-pointer ${
                                currentPage === page
                                    ? 'bg-[#3f51b5] text-white'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {page}
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
                title="Confirm Delete"
                message={`Are you sure you want to delete the property "${propertyToDelete?.title}"? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                confirmText="Delete Now"
                confirmColor="bg-red-600 hover:bg-red-700"
                icon={<FaTrashAlt className="h-6 w-6 text-red-600" />}
                iconBg="bg-red-100"
            />
        </div>
    )
}

export default MyProperties
