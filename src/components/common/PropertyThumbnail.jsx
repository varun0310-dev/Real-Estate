import React, { useState } from 'react';
import { API_URL } from '../../config';
import { FaBuilding } from 'react-icons/fa';

/**
 * Robust Property Thumbnail component.
 * Displays property photo if valid.
 * If photo is missing or fails to load, gracefully displays a clean placeholder
 * with building icon and initial letter instead of broken image icons.
 */
export default function PropertyThumbnail({
    src,
    title = '',
    size = 'w-10 h-10',
    rounded = 'rounded-lg',
    className = '',
    showInitial = true,
}) {
    const [imageError, setImageError] = useState(false);

    const initial = (title || '').trim().charAt(0).toUpperCase() || 'P';

    const getNormalizedSrc = (imagePath) => {
        if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        const cleanPath = imagePath.replace(/^\/+/, '');
        return `${API_URL}/${cleanPath}`;
    };

    const finalSrc = !imageError ? getNormalizedSrc(src) : null;

    return (
        <div
            className={`relative overflow-hidden flex items-center justify-center shrink-0 border border-gray-100 ${rounded} ${size} ${className}`}
        >
            {finalSrc ? (
                <img
                    src={finalSrc}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-100/70 flex items-center justify-center text-[#4960B2] font-black shadow-2xs">
                    {showInitial ? (
                        <span className="text-xs">{initial}</span>
                    ) : (
                        <FaBuilding size={14} className="text-[#4960B2]/70" />
                    )}
                </div>
            )}
        </div>
    );
}

