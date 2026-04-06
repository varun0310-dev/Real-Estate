import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

const ExploreLatestArrivals = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchLatestProperties = async () => {
            try {
                setLoading(true);
                // Fetch latest 10 approved properties
                const res = await axios.get(`${API_URL}/api/properties?limit=10&status=newest`);
                setProperties(res.data.properties || []);
            } catch (err) {
                console.error('Error fetching latest arrivals:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatestProperties();
    }, []);

    const scrollLeft = () => {
        scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="max-w-[1320px] mx-auto px-4 mt-20 py-10 bg-[#F3F5FF] rounded-md text-center">
                <p className="text-gray-500 animate-pulse">Loading latest arrivals...</p>
            </div>
        );
    }

    if (properties.length === 0) {
        return null; // Don't show the section if no properties
    }

    return (
        <div className="max-w-[1320px] mx-auto px-4 mt-20 py-10 bg-[#F3F5FF] rounded-md  ">
            {/* Heading */}
            <div className="text-center mb-8">
                <h1 className="font-[800] text-[29px] md:text-[40px] leading-[52px] text-[#111111]">
                    Explore the Latest Arrivals
                </h1>
                <p className="font-[400] text-[14px] md:text-[16px] leading-[32px] text-[#111111]/60">
                    Limited launch offers available
                </p>
            </div>

            {/* Scroll Buttons */}
            <div className="relative flex justify-center items-center ">
                <button
                    onClick={scrollLeft}
                    className=" rounded-full hidden md:block w-[100px] cursor-pointer  "
                >
                    <img src="./src/assets/homelogo/left-button.svg" alt="left" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scroll-smooth  md:px-4 py-4 hide-scrollbar "
                >
                    {properties.map((property) => (
                        <div
                            key={property._id}
                            className="bg-white flex-shrink-0 rounded-[10px] w-[350px] md:w-[450px] p-2 md:p-4 shadow-md relative"
                        >
                            {/* Top Section */}
                            <div className="flex gap-4 border-b border-dotted pb-4">
                                <div className="min-w-[120px] h-[100px]">
                                    <img
                                        src={property.images && property.images.length > 0 ? `${API_URL}${property.images[0]}` : './src/assets/homelogo/card-img.svg'}
                                        alt={property.title}
                                        className="w-full h-full object-cover rounded-lg shadow-sm"
                                        onError={(e) => { e.target.src = './src/assets/homelogo/card-img.svg'; }}
                                    />
                                </div>
                                <div className="flex flex-col justify-center space-y-0.5 overflow-hidden">
                                    <h1 className="font-bold text-[14px] md:text-[20px] text-[#111111] truncate" title={property.title}>
                                        {property.title}
                                    </h1>
                                    <p className="font-medium text-[14px] md:text-[18px] text-[#111111]/40 truncate">
                                        {property.cityId?.name || 'Local Area'}, {property.countryId?.name || 'Bhubaneswar'}
                                    </p>
                                    <p className="font-semibold text-[14px] md:text-[16px] text-black">
                                        ${property.price?.toLocaleString() || 'Contact for price'}{' '}
                                        <span className="text-black/40 text-[12px] md:text-[14px] ml-1">
                                            {property.bedrooms ? `${property.bedrooms} BHK` : ''} {property.propertyType || 'Apartment'}
                                        </span>
                                    </p>
                                    <p className="font-normal text-[#009F05] text-[11px] md:text-[15px]">
                                        New Launch{' '}
                                        <span className="text-[#111111]/40">just added in {property.neighborhood || 'the area'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Section */}
                            <div className="mt-6 flex justify-between items-center px-3">
                                <div className="flex items-center gap-2">
                                    <img
                                        src="./src/assets/homelogo/pin-logo.svg"
                                        alt="pin-logo"
                                        className="w-[20px] h-[20px]"
                                    />
                                    <p className="font-medium text-[12px] md:text-[16px] text-[#111111]/70">
                                        Zero brokerage on top choices.
                                    </p>
                                </div>

                                <button 
                                    className="bg-[#4960B2] text-white h-[38px] md:h-[48px] px-6 text-[12px] md:text-[16px] leading-[27px] rounded-[10px] font-medium hover:bg-[#3a4ea2] transition"
                                    onClick={() => window.location.href = `/properties/${property._id}`}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={scrollRight}
                    className="rounded-full hidden md:block w-[100px] cursor-pointer "
                >
                    <img
                        src="./src/assets/homelogo/left-button.svg"
                        alt="right"
                        className="rotate-180"
                    />
                </button>
            </div>
        </div>
    );
};

export default ExploreLatestArrivals;
