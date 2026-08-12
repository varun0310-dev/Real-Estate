import axios from 'axios';
import { API_URL } from '../config';

const SEARCHES_KEY = 'recentSearches';
const VIEWS_KEY = 'recentViews';
const MAX_ITEMS = 20;

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

/**
 * Sync local storage activity with DB on login
 */
export async function syncActivityOnLogin() {
    const token = getToken();
    if (!token) return;

    try {
        const searches = getRecentSearches();
        const views = getRecentViews();

        if (searches.length === 0 && views.length === 0) return;

        const res = await axios.post(
            `${API_URL}/api/activity/sync`,
            { searches, views },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update local storage with merged data from server
        if (res.data) {
            localStorage.setItem(SEARCHES_KEY, JSON.stringify(res.data.recentSearches || []));
            localStorage.setItem(VIEWS_KEY, JSON.stringify(res.data.recentViews || []));
            window.dispatchEvent(new CustomEvent('recentActivityUpdated'));
        }
    } catch (err) {
        console.error('Failed to sync activity on login:', err);
    }
}

/**
 * Initialize activity state by fetching from DB if logged in, otherwise from localStorage
 */
export async function initActivityState() {
    const token = getToken();
    if (!token) {
        window.dispatchEvent(new CustomEvent('recentActivityUpdated'));
        return;
    }
    
    // The Header already fetches the profile. We could rely on that, but to be safe and independent:
    try {
        const res = await axios.get(`${API_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.user) {
            localStorage.setItem(SEARCHES_KEY, JSON.stringify(res.data.user.recentSearches || []));
            localStorage.setItem(VIEWS_KEY, JSON.stringify(res.data.user.recentViews || []));
            window.dispatchEvent(new CustomEvent('recentActivityUpdated'));
        }
    } catch (err) {
        console.error('Failed to fetch activity state:', err);
    }
}

export function getRecentSearches() {
    try {
        const raw = localStorage.getItem(SEARCHES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getRecentViews() {
    try {
        const raw = localStorage.getItem(VIEWS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export async function saveRecentSearch(filters) {
    const parts = [];
    if (filters.status && filters.status !== 'all') {
        parts.push(filters.status === 'For Sale' ? 'Buy' : 'Rent');
    }
    if (filters.query) {
        parts.push(`"${filters.query}"`);
    }
    if (filters.locationLabel) {
        parts.push(`in ${filters.locationLabel}`);
    }
    if (filters.bedrooms && filters.bedrooms !== 'any') {
        parts.push(`${filters.bedrooms} BHK`);
    }
    if (filters.minPrice || filters.maxPrice) {
        const min = filters.minPrice ? `$${Number(filters.minPrice).toLocaleString()}` : '';
        const max = filters.maxPrice ? `$${Number(filters.maxPrice).toLocaleString()}` : '';
        if (min && max) parts.push(`${min}–${max}`);
        else if (min) parts.push(`from ${min}`);
        else if (max) parts.push(`up to ${max}`);
    }

    const label = parts.length > 0 ? parts.join(', ') : 'All Properties';

    const entry = {
        id: Date.now().toString(),
        label,
        filters: { ...filters },
        timestamp: new Date().toISOString(),
    };

    // Optimistically update local storage
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s.label !== label);
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(SEARCHES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recentActivityUpdated'));

    // Sync to DB if logged in
    const token = getToken();
    if (token) {
        try {
            await axios.post(
                `${API_URL}/api/activity`,
                { type: 'search', item: entry },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to save recent search to DB:', err);
        }
    }

    return updated;
}

export async function saveRecentView(property) {
    if (!property || !property._id) return;

    const entry = {
        id: Date.now().toString(),
        propertyId: property._id,
        title: property.title || 'Untitled Property',
        price: property.price || 0,
        image: property.images?.[0] || '',
        address: property.address || property.cityId?.name || property.neighborhood || 'N/A',
        propertyType: property.propertyType || property.propertyStatus || '',
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        size: property.size || 0,
        categoryName: property.categoryId?.name || '',
        timestamp: new Date().toISOString(),
    };

    // Optimistically update local storage
    const existing = getRecentViews();
    const filtered = existing.filter((v) => v.propertyId !== property._id);
    const updated = [entry, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(VIEWS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('recentActivityUpdated'));

    // Sync to DB if logged in
    const token = getToken();
    if (token) {
        try {
            await axios.post(
                `${API_URL}/api/activity`,
                { type: 'view', item: entry },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Failed to save recent view to DB:', err);
        }
    }

    return updated;
}

export async function clearRecentSearches() {
    localStorage.setItem(SEARCHES_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('recentActivityUpdated'));

    const token = getToken();
    if (token) {
        try {
            await axios.delete(`${API_URL}/api/activity/search`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to clear searches from DB:', err);
        }
    }
}

export async function clearRecentViews() {
    localStorage.setItem(VIEWS_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('recentActivityUpdated'));

    const token = getToken();
    if (token) {
        try {
            await axios.delete(`${API_URL}/api/activity/view`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Failed to clear views from DB:', err);
        }
    }
}

export function groupByDate(items) {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

    items.forEach((item) => {
        const itemDate = new Date(item.timestamp);
        const itemDay = itemDate.toDateString();

        let label;
        if (itemDay === today.toDateString()) {
            label = `Today - ${formatDate(itemDate)}`;
        } else if (itemDay === yesterday.toDateString()) {
            label = `Yesterday - ${formatDate(itemDate)}`;
        } else {
            label = formatDate(itemDate);
        }

        if (!groups[label]) groups[label] = [];
        groups[label].push(item);
    });

    return groups;
}
