import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiMapPin, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import { LuBed, LuBath } from 'react-icons/lu';
import { BiArea } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { API_URL } from '../config';
import FloatingChat from '../components/chat/FloatingChat';

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState('');
    
    // Chat widget states
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeConversation, setActiveConversation] = useState(null);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/properties/${id}`);
                setProperty(response.data.property);
                if (response.data.property.images && response.data.property.images.length > 0) {
                    setActiveImage(response.data.property.images[0]);
                }

                const token = localStorage.getItem('token');
                if (token) {
                    const profileRes = await axios.get(`${API_URL}/api/profile/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (profileRes.data && profileRes.data.user) {
                        setCurrentUser(profileRes.data.user);
                    }
                }
            } catch (err) {
                console.error("Error fetching property:", err);
                setError('Failed to load property details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-[#4960B2] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Property not found'}</h2>
                <Link to="/properties" className="text-[#4960B2] font-semibold hover:underline">
                    Back to Properties
                </Link>
            </div>
        );
    }

    const {
        title, description, price, address,
        bedrooms, bathrooms, size, images,
        categoryId, amenities, seller,
        countryId, stateId, cityId,
        propertyType
    } = property;

    const handleChatClick = async () => {
        if (!currentUser) {
            toast.error("Please login with a Buyer account to chat with seller.");
            return;
        }
        if (currentUser.userType !== 'buyer') {
            toast.error("Please login with a Buyer account to chat with seller.");
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/chat/conversations`, 
                { propertyId: property._id },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            setActiveConversation(res.data.conversation);
            setIsChatOpen(true);
        } catch (err) {
            console.error("Chat error:", err);
            toast.error(err.response?.data?.message || "Could not open chat");
        }
    };

    const fullAddress = [
        address,
        cityId?.name,
        stateId?.name,
        countryId?.name
    ].filter(Boolean).join(', ');

    return (
        <div className="bg-gray-50 min-h-screen pb-16">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 pt-8 pb-6 shadow-sm">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-[#4960B2]/10 text-[#4960B2] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {propertyType || 'For Sale'}
                                </span>
                                {categoryId && (
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        {categoryId.name}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-[#1e1e2d] mb-2">{title}</h1>
                            <p className="text-gray-500 flex items-center gap-2 text-sm">
                                <FiMapPin className="text-[#4960B2]" />
                                {fullAddress || 'Location not specified'}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <h2 className="text-4xl font-extrabold text-[#4960B2]">
                                ${price?.toLocaleString()}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">Est. Mortgage: ${(price * 0.005).toLocaleString()}/mo</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content */}
                    <div className="lg:w-2/3">
                        {/* Image Gallery */}
                        {images && images.length > 0 ? (
                            <div className="mb-8">
                                <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden mb-4 shadow-sm relative">
                                    <img 
                                        src={`${API_URL}${activeImage}`} 
                                        alt={title} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {images.length > 1 && (
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {images.map((img, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => setActiveImage(img)}
                                                className={`w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${activeImage === img ? 'border-[#4960B2]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                            >
                                                <img src={`${API_URL}${img}`} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="aspect-[16/9] w-full bg-gray-200 rounded-2xl mb-8 flex items-center justify-center">
                                <span className="text-gray-400 font-medium">No Images Available</span>
                            </div>
                        )}

                        {/* Quick Facts */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-wrap justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#4960B2]/10 flex items-center justify-center text-[#4960B2]">
                                    <LuBed className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Bedrooms</p>
                                    <p className="text-lg font-bold text-[#1e1e2d]">{bedrooms || 0}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#4960B2]/10 flex items-center justify-center text-[#4960B2]">
                                    <LuBath className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Bathrooms</p>
                                    <p className="text-lg font-bold text-[#1e1e2d]">{bathrooms || 0}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#4960B2]/10 flex items-center justify-center text-[#4960B2]">
                                    <BiArea className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Square Feet</p>
                                    <p className="text-lg font-bold text-[#1e1e2d]">{size || 0} sqft</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                            <h3 className="text-xl font-bold text-[#1e1e2d] mb-4">About this property</h3>
                            <div className="prose max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {description || 'No description provided.'}
                            </div>
                        </div>

                        {/* Amenities */}
                        {amenities && amenities.length > 0 && (
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
                                <h3 className="text-xl font-bold text-[#1e1e2d] mb-6">Amenities</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                                    {amenities.map(amenity => (
                                        <div key={amenity._id} className="flex items-center gap-2 text-gray-700">
                                            <FiCheckCircle className="text-[#4960B2] flex-shrink-0" />
                                            <span className="text-sm font-medium">{amenity.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Seller Info */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-[#1e1e2d] mb-6">Contact Seller</h3>
                            
                            {seller ? (
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 mb-4 shadow-sm flex items-center justify-center bg-[#4960B2]/10">
                                        {seller.profileImage ? (
                                            <img 
                                                src={`${API_URL}${seller.profileImage}`} 
                                                alt={seller.name}
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <span className="text-3xl font-bold text-[#4960B2]">
                                                {seller.name ? seller.name.charAt(0).toUpperCase() : '?'}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-xl font-bold text-[#1e1e2d]">{seller.name} {seller.lastname}</h4>
                                    {seller.companyName && (
                                        <p className="text-sm text-gray-500 font-medium mb-1">{seller.companyName}</p>
                                    )}
                                    <p className="text-xs text-[#4960B2] font-bold uppercase tracking-wider mb-6">Property Owner / Agent</p>

                                    <div className="w-full space-y-3">
                                        <button 
                                            onClick={handleChatClick}
                                            className="cursor-pointer w-full bg-[#4960B2] text-white py-3 rounded-xl font-bold hover:bg-[#3a4d91] transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#4960B2]/20"
                                        >
                                            <FiMessageSquare /> Chat with Seller
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center">Seller information is unavailable.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Chat Popup */}
            {isChatOpen && activeConversation && currentUser && (
                <FloatingChat
                    conversation={activeConversation}
                    currentUser={currentUser}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </div>
    );
}
