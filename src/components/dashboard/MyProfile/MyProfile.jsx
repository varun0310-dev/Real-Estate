import React, { useRef, useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { IoMdCloudUpload, IoMdClose } from 'react-icons/io';
import { FiEdit2, FiMail, FiUser, FiPhone, FiBriefcase, FiMapPin, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_URL } from '../../../config';

// Helper Input Component with Icon
const Field = ({ label, value, onChange, placeholder, disabled = false, icon: Icon, type = "text" }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-[#1e2d5c]">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4960B2]" />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                className={`w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2] bg-[#f7f9fc] transition-all duration-150 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={disabled}
                autoComplete="off"
            />
        </div>
    </div>
);

const Dropdown = ({ label, value, options, onChange }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-[#1e2d5c]">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2] bg-[#f7f9fc] transition-all duration-150 appearance-none"
            >
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

const ProfileItem = ({ label, value, icon: Icon }) => (
    <div className="bg-[#f7f9fc] rounded-lg p-4 shadow-sm flex items-center gap-3 border border-gray-100">
        {Icon && <Icon className="text-[#4960B2]" />}
        <div>
            <p className="text-gray-500 font-medium mb-1 text-[11px] uppercase tracking-wider">{label}</p>
            <p className="text-[#1e2d5c] font-semibold">{value}</p>
        </div>
    </div>
);

const MyProfileComp = () => {
    const { setProfile: setLayoutProfile } = useOutletContext() || {};
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        role: 'buyer',
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        position: '',
        language: '',
        companyName: '',
        taxNumber: '',
        address: '',
        about: '',
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const inputRef = useRef(null);

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/api/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProfile(res.data.user);
            } catch (err) {
                setError('Failed to load profile.');
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    // When profile changes (after save), update formData and imagePreview
    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.name || '',
                role: profile.userType || 'buyer',
                email: profile.email || '',
                phone: profile.phone || '',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                position: profile.position || '',
                language: profile.language || '',
                companyName: profile.companyName || '',
                taxNumber: profile.licenseNumber || '',
                address: profile.address || '',
                about: profile.about || '',
            });
            setImagePreview(
                profile.profileImage
                    ? profile.profileImage.startsWith('http')
                        ? profile.profileImage
                        : `${API_URL}${profile.profileImage}`
                    : null
            );
        }
    }, [profile]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (field === "email") {
            setEmailError(
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Please enter a valid email."
            );
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageFile(null);
        if (inputRef.current) inputRef.current.value = null;
    };

    const handleUpdateProfile = async () => {
        if (emailError) {
            toast.error("Please fix the errors before saving.");
            return;
        }
        try {
            const data = new FormData();
            data.append('name', formData.username);
            data.append('userType', formData.role);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('companyName', formData.companyName);
            data.append('licenseNumber', formData.taxNumber);
            data.append('address', formData.address);
            data.append('about', formData.about);
            if (imageFile) {
                data.append('profileImage', imageFile);
            }

            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/api/profile`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 && res.data?.user) {
                setProfile(res.data.user);
                if (setLayoutProfile) setLayoutProfile(res.data.user);
                toast.success('Profile updated!');
                setIsEditing(false);
                setImageFile(null);
            } else {
                toast.error('Profile update failed');
            }
        } catch (err) {
            console.error('Profile update error:', err);
            toast.error('Profile update failed');
        }
    };

    const handleCancelEdit = () => {
        if (profile) {
            setFormData({
                username: profile.name || '',
                role: profile.userType || 'buyer',
                email: profile.email || '',
                phone: profile.phone || '',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                position: profile.position || '',
                language: profile.language || '',
                companyName: profile.companyName || '',
                taxNumber: profile.licenseNumber || '',
                address: profile.address || '',
                about: profile.about || '',
            });
            setImagePreview(
                profile.profileImage
                    ? profile.profileImage.startsWith('http')
                        ? profile.profileImage
                        : `${API_URL}${profile.profileImage}`
                    : null
            );
            setImageFile(null);
            setEmailError("");
        }
        setIsEditing(false);
    };

    const userTypes = ['buyer', 'seller'];
    const isSuperAdmin = profile?.userType === 'superadmin' || profile?.role === 'superadmin';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4960B2]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-red-600 font-medium bg-red-50 px-6 py-3 rounded-xl border border-red-100">{error}</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg text-gray-500 italic">No profile data found.</div>
            </div>
        );
    }

    if (!isEditing) {
        return (
            <div className="flex flex-col items-center py-8 px-4">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                    <div className="h-32 bg-gradient-to-r from-[#4960B2] to-[#1e2d5c]"></div>
                    <div className="px-8 pb-8 -mt-16">
                        <div className="flex flex-col md:flex-row items-end gap-6 mb-8 border-b pb-8">
                            <div className="relative group">
                                <img
                                    src={
                                        imagePreview ||
                                        'https://ui-avatars.com/api/?name=User&background=E0E7FF&color=1e2d5c'
                                    }
                                    alt="profile"
                                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
                                />
                            </div>
                            <div className="flex-1 pb-2">
                                <h2 className="text-3xl font-extrabold text-[#1e2d5c]">{profile?.name || 'N/A'}</h2>
                                <p className="text-lg text-[#4960B2] font-semibold">{profile?.userType?.toUpperCase() || 'N/A'}</p>
                                <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                                    <span className="flex items-center gap-2"><FiPhone className="text-[#4960B2]" /> {profile?.phone || 'N/A'}</span>
                                    <span className="flex items-center gap-2"><FiMail className="text-[#4960B2]" /> {profile?.email || 'N/A'}</span>
                                </div>
                            </div>
                            <button
                                className="flex items-center gap-2 px-6 py-3 bg-[#4960B2] text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-[#374299] hover:-translate-y-1 transition-all active:translate-y-0 cursor-pointer font-bold"
                                onClick={() => setIsEditing(true)}
                                type="button"
                            >
                                <FiEdit2 /> Edit Profile
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ProfileItem label="Firm Name" value={profile?.companyName || 'N/A'} icon={FiBriefcase} />
                            <ProfileItem label="Tax / License" value={profile?.licenseNumber || 'N/A'} icon={FiBriefcase} />
                            <ProfileItem label="Address" value={profile?.address || 'N/A'} icon={FiMapPin} />
                            <div className="md:col-span-2 lg:col-span-3 mt-4">
                                <h3 className="text-sm font-bold text-[#1e2d5c] uppercase tracking-[0.2em] mb-4">About Me</h3>
                                <div className="bg-[#f7f9fc] p-6 rounded-2xl text-gray-600 leading-relaxed border border-gray-100">
                                    {profile?.about || "No bio information provided."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-8 px-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-[#1e2d5c] tracking-tight">Edit Profile</h2>
                    <IoMdClose className="text-2xl text-gray-400 cursor-pointer hover:text-red-500 transition-colors" onClick={handleCancelEdit} />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-8 border-b border-gray-100">
                    <div className="relative group">
                        <img
                            src={
                                imagePreview ||
                                'https://ui-avatars.com/api/?name=User&background=E0E7FF&color=1e2d5c'
                            }
                            alt="profile"
                            className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300"
                        />
                        {imagePreview && (
                            <button
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                                type="button"
                            >
                                <IoMdClose className="text-sm" />
                            </button>
                        )}
                    </div>
                    <div>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#4960B2] text-[#4960B2] text-sm font-bold rounded-xl hover:bg-[#4960B2] hover:text-white transition-all cursor-pointer shadow-sm active:scale-95">
                            <IoMdCloudUpload className="text-xl" />
                            <span>Update Photo</span>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                onChange={handleImageChange}
                                ref={inputRef}
                            />
                        </label>
                        <p className="mt-2 text-xs text-gray-400 font-medium ml-1 italic italic">Max size 2MB. formats: png, jpg</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
                    <Field
                        label="Display Name"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        icon={FiUser}
                        placeholder="John Doe"
                    />
                    {!isSuperAdmin && (
                        <Dropdown
                            label="User Account Type"
                            value={formData.role}
                            options={userTypes}
                            onChange={(e) => handleChange('role', e.target.value)}
                        />
                    )}
                    <div className="md:col-span-1">
                        <Field
                            label="Contact Email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            icon={FiMail}
                            type="email"
                            placeholder="john@example.com"
                        />
                        {emailError && (
                            <p className="text-[11px] text-red-500 mt-1.5 font-bold animate-fadeIn">{emailError}</p>
                        )}
                    </div>
                    <Field
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        icon={FiPhone}
                        placeholder="+1 234 567 890"
                    />
                    <Field
                        label="Company / Firm Name"
                        value={formData.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        icon={FiBriefcase}
                        placeholder="Real Estate Co."
                    />
                    <Field
                        label="Tax / License ID"
                        value={formData.taxNumber}
                        onChange={(e) => handleChange('taxNumber', e.target.value)}
                        icon={FiBriefcase}
                        placeholder="TX-90123"
                    />
                    <div className="md:col-span-2">
                        <Field
                            label="Physical Address"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            icon={FiMapPin}
                            placeholder="123 Luxury Ave, Beverly Hills, CA"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-bold text-[#1e2d5c] mb-1.5 flex items-center gap-2"><FiInfo className="text-xs" /> Bio / About Me</label>
                        <textarea
                            value={formData.about}
                            onChange={(e) => handleChange('about', e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4960B2] bg-[#f7f9fc] transition-all resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-4 border-t border-gray-100 pt-8">
                    <button
                        className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 cursor-pointer border border-gray-200"
                        onClick={handleCancelEdit}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="px-8 py-3 bg-gradient-to-r from-[#4960B2] to-[#1e2d5c] text-white rounded-xl font-bold shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        onClick={handleUpdateProfile}
                        disabled={!!emailError}
                        type="button"
                    >
                        Sync Profile
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default MyProfileComp;
