import React, { useState } from 'react';
import { API_URL } from '../../config';

const ROLE_GRADIENTS = {
    buyer: 'from-emerald-400 to-emerald-600 text-white',
    seller: 'from-blue-500 to-[#4960B2] text-white',
    superadmin: 'from-purple-500 to-indigo-600 text-white',
    admin: 'from-purple-500 to-indigo-600 text-white',
};

const DEFAULT_GRADIENT = 'from-[#4960B2] to-[#3a4d91] text-white';

/**
 * Robust User Avatar component.
 * Displays user photo if valid.
 * If photo is missing, empty, or fails to load, gracefully falls back
 * to a colorful alphabet initials badge so broken image icons never appear.
 */
export default function UserAvatar({
    src,
    name = '',
    role = '',
    size = 'w-9 h-9',
    textSize = 'text-xs',
    className = '',
}) {
    const [imageError, setImageError] = useState(false);

    // Initial letter of name
    const initial = (name || '').trim().charAt(0).toUpperCase() || 'U';

    // Normalize image source to handle relative paths, uploads, and full URLs
    const getNormalizedSrc = (imagePath) => {
        if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') return null;
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
        const cleanPath = imagePath.replace(/^\/+/, '');
        return `${API_URL}/${cleanPath}`;
    };

    const finalSrc = !imageError ? getNormalizedSrc(src) : null;
    const gradient = ROLE_GRADIENTS[role?.toLowerCase()] || DEFAULT_GRADIENT;

    return (
        <div
            className={`relative rounded-full overflow-hidden flex items-center justify-center select-none shrink-0 ${size} ${className}`}
        >
            {finalSrc ? (
                <img
                    src={finalSrc}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div
                    className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold tracking-tight shadow-xs ${textSize}`}
                >
                    {initial}
                </div>
            )}
        </div>
    );
}

