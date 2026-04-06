import React, { useState, useEffect } from 'react';
import { HiArrowLeft } from 'react-icons/hi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../../config';

const AmenityForm = ({ onBack, amenityToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (amenityToEdit) {
            setName(amenityToEdit.name);
            setDescription(amenityToEdit.description);
        }
    }, [amenityToEdit]);

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Amenity name is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const payload = { name, description };
            if (amenityToEdit) {
                await axios.put(`${API_URL}/api/amenities/${amenityToEdit._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Amenity updated successfully');
            } else {
                await axios.post(`${API_URL}/api/amenities`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Amenity added successfully');
            }
            onBack();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#f5f6fa] min-h-screen">
            <div className='flex items-center mb-4' >
                <button
                    onClick={onBack}
                    className="flex items-center text-[#3f51b5] font-medium hover:underline cursor-pointer"
                >
                    <HiArrowLeft className="mr-2" size={20} />
                </button>
                <h1 className="text-xl font-bold text-[#1e1e2d] ">{amenityToEdit ? 'Edit Amenity' : 'Add New Amenity'}</h1>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amenity Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none rounded-md text-sm transition-colors`}
                            placeholder="e.g. Swimming Pool, Gym, WiFi"
                        />
                        {errors.name && <p className="text-red-500 text-[12px] mt-1 font-medium">{errors.name}</p>}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 focus:outline-none rounded-md resize-none text-sm"
                            placeholder="Brief description of the amenity"
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#3f51b5] text-white px-6 py-2 rounded hover:bg-[#334296] transition cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (amenityToEdit ? 'Update Amenity' : 'Save Amenity')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AmenityForm;
