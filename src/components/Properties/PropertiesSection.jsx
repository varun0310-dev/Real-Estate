import React, { useState, useEffect } from 'react';
import { FiHeart, FiMapPin, FiHome, FiMaximize } from 'react-icons/fi';
import { LuBed, LuBath } from 'react-icons/lu';
import axios from 'axios';
import { API_URL } from '../../config';
import { saveRecentView } from '../../hooks/useRecentActivity';

const sortOptions = [
    { value: 'newest', label: 'Newest' },
    // { value: 'best-seller', label: 'Best Seller' },
    { value: 'price-low', label: 'Price Low' },
    { value: 'price-high', label: 'Price High' },
];

const PropertiesSection = ({ filters }) => {
    const [properties, setProperties] = useState([]);
    const [totalProperties, setTotalProperties] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const [view, setView] = useState('grid');
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/properties`, {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    type: filters.status, 
                    categoryId: filters.propertyTypes.includes('all') ? 'all' : filters.propertyTypes.join(','),
                    countryId: filters.countryId,
                    stateId: filters.stateId,
                    cityId: filters.cityId,
                    location: filters.location,
                    minPrice: filters.minPrice || filters.price[0],
                    maxPrice: filters.maxPrice || filters.price[1],
                    bedrooms: filters.bedrooms,
                    bathrooms: filters.bathrooms,
                    sqftMin: filters.sqftMin,
                    sqftMax: filters.sqftMax,
                    yearMin: filters.yearMin,
                    yearMax: filters.yearMax,
                    sort: sortBy,
                    q: filters.query
                }
            });
            setProperties(res.data.properties || []);
            setTotalProperties(res.data.total || 0);
            setTotalPages(res.data.pages || 1);
        } catch (err) {
            console.error('Error fetching properties:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchProperties();
    }, [
        filters.status, 
        filters.propertyTypes, 
        filters.countryId, 
        filters.stateId, 
        filters.cityId,
        filters.location,
        filters.minPrice, 
        filters.maxPrice, 
        filters.price,
        filters.bedrooms, 
        filters.bathrooms, 
        filters.sqftMin, 
        filters.sqftMax, 
        filters.yearMin, 
        filters.yearMax,
        filters.query,
        sortBy
    ]);

    useEffect(() => {
        fetchProperties();
    }, [currentPage]);

    // Sorting local logic or reliance on API sorting
    const displayProperties = properties;

    const handleViewDetail = (item) => {
        // Track this property view in recent activity
        saveRecentView(item);
        // TODO: Navigate to property detail page when it exists
        // navigate(`/properties/${item._id}`);
    };

    return (
        <div className="md:mx-auto px-5 md:px-4 max-w-screen-xl pb-4 ">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-7 gap-4 sm:gap-0">
                <h1 className=" text-[11px] md:text-sm text-gray-500 italic">
                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalProperties)} of {totalProperties} results
                </h1>
                <div className="flex flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center">
                        <span className="mr-2 text-gray-600 text-[11px] md:text-sm font-semibold">Sort by</span>
                        <select
                            className="border border-gray-300 focus:outline-none rounded px-2 py-1 text-[11px] md:text-sm bg-white"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-400">|</span>
                        <button
                            className={`font-semibold  text-[11px] md:text-sm transition-colors ${view === 'grid' ? 'text-[#E75C42]' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setView('grid')}
                        >
                            Grid
                        </button>
                        <button
                            className={`font-semibold text-[11px] md:text-sm transition-colors ${view === 'list' ? 'text-[#E75C42]' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setView('list')}
                        >
                            List
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-500 italic">Loading properties...</div>
            ) : displayProperties.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No properties found.</div>
            ) : (
                <div
                    className={`${view === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8'
                        : 'flex flex-col gap-8'
                        }`}
                >
                    {displayProperties.map((item) =>
                        view === 'grid' ? (
                            <div
                                key={item._id}
                                className="rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-500 group"
                            >
                                <div className="relative overflow-hidden aspect-video">
                                    <img
                                        src={item.images && item.images[0] ? `${API_URL}${item.images[0]}` : 'https://via.placeholder.com/600x400?text=No+Image'}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute bottom-4 left-4 text-white text-lg font-bold px-4 py-2 rounded-xl bg-[#1e2d5c]/80 backdrop-blur-sm border border-white/10">
                                        ${item.price?.toLocaleString()}
                                    </div>
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                                        <FiHeart className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-[#1e1e2d] mb-2 truncate group-hover:text-[#4960B2] transition-colors">{item.title}</h3>
                                    <p className="text-sm text-gray-500 flex items-center mb-5 font-medium">
                                        <FiMapPin className="mr-2 text-[#4960B2]" />
                                        {item.address || item.cityId?.name || item.neighborhood || 'N/A'}
                                    </p>
                                    <div className="flex items-center gap-4 py-4 border-y border-gray-100 mb-4 overflow-x-auto no-scrollbar">
                                        <span className="flex items-center text-xs text-gray-600 font-medium whitespace-nowrap">
                                            <LuBed className="mr-1.5 text-lg" /> {item.bedrooms || 0} Bed
                                        </span>
                                        <span className="flex items-center text-xs text-gray-600 font-medium whitespace-nowrap">
                                            <LuBath className="mr-1.5 text-lg" /> {item.bathrooms || 0} Bath
                                        </span>
                                        <span className="flex items-center text-xs text-gray-600 font-medium whitespace-nowrap">
                                            <FiMaximize className="mr-1.5 text-lg" /> {item.size || 0} Sqft
                                        </span>
                                    </div>

                                    {item.amenities?.length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {item.amenities.slice(0, 3).map(amenity => (
                                                <span key={amenity._id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{amenity.name}</span>
                                            ))}
                                            {item.amenities.length > 3 && <span className="text-[10px] text-gray-400">+{item.amenities.length - 3}</span>}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-xs text-gray-500 flex items-center font-bold uppercase tracking-widest">
                                            <FiHome className="mr-2 text-[#4960B2] text-lg" /> {item.propertyType || item.propertyStatus}
                                        </span>
                                        <button onClick={() => handleViewDetail(item)} className="text-sm font-bold text-[#4960B2] hover:underline cursor-pointer">View Detail</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                key={item._id}
                                className="flex flex-col sm:flex-row bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group border border-gray-100"
                            >
                                <div className="sm:w-[40%] w-full relative h-[250px] sm:h-auto overflow-hidden">
                                    <img
                                        src={item.images && item.images[0] ? `${API_URL}${item.images[0]}` : 'https://via.placeholder.com/600x400?text=No+Image'}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                                        <FiHeart className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="sm:w-[60%] w-full p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-2xl font-bold text-[#1e1e2d] group-hover:text-[#4960B2] transition-colors">{item.title}</h3>
                                            <div className="text-2xl font-black text-[#4960B2]">
                                                ${item.price?.toLocaleString()}
                                            </div>
                                        </div>
                                        <p className="text-gray-500 flex items-center mb-6 font-medium">
                                            <FiMapPin className="mr-2 text-[#4960B2]" />
                                            {item.address || item.cityId?.name || item.neighborhood || 'N/A'}
                                        </p>

                                        <div className="flex flex-wrap gap-6 mb-6">
                                            <span className="flex items-center text-sm text-gray-600 font-semibold italic">
                                                <LuBed className="mr-2 text-xl text-[#4960B2]" /> {item.bedrooms || 0} Bed
                                            </span>
                                            <span className="flex items-center text-sm text-gray-600 font-semibold italic">
                                                <LuBath className="mr-2 text-xl text-[#4960B2]" /> {item.bathrooms || 0} Bath
                                            </span>
                                            <span className="flex items-center text-sm text-gray-600 font-semibold italic">
                                                <FiMaximize className="mr-2 text-xl text-[#4960B2]" /> {item.size || 0} Sqft
                                            </span>
                                        </div>

                                        {item.amenities?.length > 0 && (
                                            <div className="mb-6 flex flex-wrap gap-2">
                                                {item.amenities.map(amenity => (
                                                    <span key={amenity._id} className="text-[10px] bg-gray-50 text-gray-400 border border-gray-100 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{amenity.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 flex items-center font-bold uppercase tracking-widest">
                                            <FiHome className="mr-2 text-[#4960B2] text-xl" /> {item.propertyType || item.propertyStatus}
                                        </span>
                                        <button onClick={() => handleViewDetail(item)} className="bg-[#4960B2] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#3d5094] transition-all hover:px-8 cursor-pointer">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-16 flex-wrap">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-sm font-bold text-[#1e1e2d] shadow-sm hover:border-[#4960B2] hover:text-[#4960B2] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentPage(idx)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${currentPage === idx
                                ? 'bg-[#4960B2] text-white scale-110 shadow-blue-200'
                                : 'bg-white border border-gray-100 text-gray-500 hover:text-[#4960B2] hover:border-[#4960B2]'
                                }`}
                        >
                            {idx}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-sm font-bold text-[#1e1e2d] shadow-sm hover:border-[#4960B2] hover:text-[#4960B2] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default PropertiesSection;
