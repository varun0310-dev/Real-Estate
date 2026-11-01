import React from 'react';
import { FiMapPin, FiNavigation } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import MapImage from '@assets/Map.svg';

const DashboardMap = ({
    title = 'Properties Map View',
    properties = [],
    exploreLink = '/properties',
}) => {
    const validCoords = properties.filter((p) => p.latitude && p.longitude);

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                        <FiMapPin size={15} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-[#111827]">{title}</h2>
                        <p className="text-[11px] text-gray-400">
                            {validCoords.length > 0
                                ? `${validCoords.length} geo-tagged properties`
                                : 'Explore properties across regions'}
                        </p>
                    </div>
                </div>

                <Link
                    to={exploreLink}
                    className="text-xs font-semibold text-[#4960B2] hover:text-[#3b4f98] flex items-center gap-1 transition"
                >
                    <FiNavigation size={12} /> Explore
                </Link>
            </div>

            {/* Map representation */}
            <div className="relative w-full h-56 rounded-xl overflow-hidden border border-gray-100 bg-slate-50 group">
                <img
                    src={MapImage}
                    alt="Map View"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Floating summary badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-sm border border-white/50 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-gray-800">
                            {properties.length > 0 ? `${properties.length} Active Listings` : 'All Regions'}
                        </span>
                    </div>
                    <Link
                        to={exploreLink}
                        className="text-[#4960B2] font-bold text-[11px] hover:underline"
                    >
                        View Interactive Map →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardMap;

