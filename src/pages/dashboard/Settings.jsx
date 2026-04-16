import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import DefaultLogo from '@assets/logo.svg';
import { FiUploadCloud, FiTrash2, FiCheck, FiImage } from 'react-icons/fi';

const Settings = () => {
    const [logoPreview, setLogoPreview] = useState(null);
    const [currentLogo, setCurrentLogo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Fetch current logo on mount
    useEffect(() => {
        fetchCurrentLogo();
    }, []);

    const fetchCurrentLogo = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/settings/logo`);
            if (res.data.logoUrl) {
                setCurrentLogo(`${API_URL}${res.data.logoUrl}`);
            }
        } catch (err) {
            console.error('Failed to fetch logo:', err);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ text: 'Please upload a valid image (PNG, JPG, WEBP, or SVG)', type: 'error' });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ text: 'File size must be less than 5MB', type: 'error' });
            return;
        }

        setSelectedFile(file);
        setMessage({ text: '', type: '' });

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e) => {
        handleFileSelect(e.target.files[0]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage({ text: 'Please select a file first', type: 'error' });
            return;
        }

        setUploading(true);
        setMessage({ text: '', type: '' });

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('logo', selectedFile);

            const res = await axios.post(`${API_URL}/api/settings/logo`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setCurrentLogo(`${API_URL}${res.data.logoUrl}`);
            setSelectedFile(null);
            setLogoPreview(null);
            setMessage({ text: 'Logo uploaded successfully!', type: 'success' });

            // Dispatch custom event so Header and Sidebar pick up the change
            window.dispatchEvent(new CustomEvent('logoUpdated'));
        } catch (err) {
            console.error('Upload error:', err);
            const errMsg = err.response?.data?.message || 'Failed to upload logo';
            setMessage({ text: errMsg, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteLogo = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/settings/logo`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCurrentLogo(null);
            setLogoPreview(null);
            setSelectedFile(null);
            setMessage({ text: 'Custom logo removed. Default logo will be used.', type: 'success' });

            window.dispatchEvent(new CustomEvent('logoUpdated'));
        } catch (err) {
            console.error('Delete error:', err);
            setMessage({ text: 'Failed to remove logo', type: 'error' });
        }
    };

    const cancelSelection = () => {
        setSelectedFile(null);
        setLogoPreview(null);
        setMessage({ text: '', type: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="max-w-3xl mx-auto pt-6">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0D1C44] tracking-tight">Settings</h1>
                <p className="text-gray-400 text-sm mt-1">Manage your site branding and configuration</p>
            </div>

            {/* Logo Settings Card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
                {/* Card Header */}
                <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-[#f8f9ff] to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4960B2]/10 flex items-center justify-center">
                            <FiImage className="text-[#4960B2] text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0D1C44]">Site Logo</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Upload a custom logo for the sidebar and header. PNG, JPG, WEBP or SVG — max 5MB.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* Message Alert */}
                    {message.text && (
                        <div
                            className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all animate-fade-in ${
                                message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                        >
                            {message.type === 'success' ? (
                                <FiCheck className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <span className="flex-shrink-0">⚠️</span>
                            )}
                            {message.text}
                        </div>
                    )}

                    {/* Current Logo Display */}
                    <div className="mb-8">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                            Current Logo
                        </label>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-[200px] h-[80px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center p-4 transition-all group-hover:border-[#4960B2]/30 group-hover:bg-[#f8f9ff]">
                                    <img
                                        src={currentLogo || DefaultLogo}
                                        alt="Current Logo"
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            e.target.src = DefaultLogo;
                                        }}
                                    />
                                </div>
                                {currentLogo && (
                                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        CUSTOM
                                    </span>
                                )}
                                {!currentLogo && (
                                    <span className="absolute -top-2 -right-2 bg-gray-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        DEFAULT
                                    </span>
                                )}
                            </div>

                            {currentLogo && (
                                <button
                                    onClick={handleDeleteLogo}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                                >
                                    <FiTrash2 className="text-base" />
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Upload / Drop Zone */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                            Upload New Logo
                        </label>
                        <div
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                dragActive
                                    ? 'border-[#4960B2] bg-[#4960B2]/5 scale-[1.01]'
                                    : logoPreview
                                    ? 'border-[#4960B2]/40 bg-[#f8f9ff]'
                                    : 'border-gray-200 bg-gray-50 hover:border-[#4960B2]/40 hover:bg-[#f8f9ff]'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={handleInputChange}
                            />

                            {logoPreview ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-[220px] h-[90px] rounded-xl border border-[#4960B2]/20 bg-white flex items-center justify-center p-4 shadow-sm">
                                        <img
                                            src={logoPreview}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#4960B2]">
                                            {selectedFile?.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            ({(selectedFile?.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">Click or drop to replace</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-[#4960B2]/10 flex items-center justify-center">
                                        <FiUploadCloud className="text-[#4960B2] text-2xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-600">
                                            Drop your logo here, or{' '}
                                            <span className="text-[#4960B2] underline underline-offset-2">browse</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            PNG, JPG, WEBP, or SVG — Maximum 5MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedFile && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4960B2] text-white font-bold text-sm shadow-[0_4px_16px_rgba(73,96,178,0.3)] hover:bg-[#3b4f98] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {uploading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck />
                                        Save Logo
                                    </>
                                )}
                            </button>
                            <button
                                onClick={cancelSelection}
                                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
