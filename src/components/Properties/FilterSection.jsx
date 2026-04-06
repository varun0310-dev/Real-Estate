import React, { useState, useEffect } from 'react';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from '../../config';

const FilterSection = ({ filters, setFilters, onSearch, onReset }) => {
    const [localQuery, setLocalQuery] = useState(filters.query);
    const [categories, setCategories] = useState([]);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catRes, countRes] = await Promise.all([
                    axios.get(`${API_URL}/api/categories/all`),
                    axios.get(`${API_URL}/api/locations/countries`)
                ]);
                setCategories(catRes.data);
                setCountries(countRes.data);
            } catch (err) {
                console.error('Error fetching initial data:', err);
            }
        };
        fetchInitialData();
    }, []);

    // Cascading selection for states when country changes
    useEffect(() => {
        const fetchStates = async () => {
            if (!filters.countryId || filters.countryId === 'all') {
                setStates([]);
                setCities([]);
                return;
            }
            try {
                const res = await axios.get(`${API_URL}/api/locations/states/${filters.countryId}`);
                setStates(res.data);
            } catch (err) {
                console.error('Error fetching states:', err);
            }
        };
        fetchStates();
    }, [filters.countryId]);

    // Cascading selection for cities when state changes
    useEffect(() => {
        const fetchCities = async () => {
            if (!filters.stateId || filters.stateId === 'all') {
                setCities([]);
                return;
            }
            try {
                const res = await axios.get(`${API_URL}/api/locations/cities/${filters.stateId}`);
                setCities(res.data);
            } catch (err) {
                console.error('Error fetching cities:', err);
            }
        };
        fetchCities();
    }, [filters.stateId]);

    // Update local keyword state if filters are reset from parent
    useEffect(() => {
        setLocalQuery(filters.query);
    }, [filters.query]);

    const handleSearchProperties = () => {
        const updatedFilters = { ...filters, query: localQuery };
        setFilters(updatedFilters);
        onSearch(updatedFilters);
    };

    const handleResetAll = () => {
        setLocalQuery('');
        onReset();
    };

    const handleTypeChange = (id) => {
        setFilters((prev) => {
            let updated;
            if (id === 'all') {
                updated = ['all'];
            } else {
                updated = prev.propertyTypes.includes(id)
                    ? prev.propertyTypes.filter(t => t !== id && t !== 'all')
                    : [...prev.propertyTypes.filter(t => t !== 'all'), id];
            }
            if (updated.length === 0) updated = ['all'];
            return { ...prev, propertyTypes: updated };
        });
    };

    return (
        <div className="w-full max-w-[400px] bg-white lg:rounded-2xl p-6 shadow-lg text-sm font-medium h-full overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-6">Listing Filter</h2>

            <div className="mb-6">
                <label className="block mb-2 font-semibold">Find your home</label>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        placeholder="What are you looking for?"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4960B2] cursor-pointer"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-semibold">Listing Status</label>
                <div className="flex flex-col space-y-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'For Sale', label: 'Buy' },
                        { id: 'For Rent', label: 'Rent' }
                    ].map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="status"
                                value={item.id}
                                checked={filters.status === item.id}
                                onChange={() => setFilters({ ...filters, status: item.id })}
                                className="accent-[#4960B2] cursor-pointer"
                            />
                            {item.label}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-semibold">Property Type</label>
                <div className="flex flex-col space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.propertyTypes.includes('all')}
                            onChange={() => handleTypeChange('all')}
                            className="accent-[#4960B2] cursor-pointer"
                        />
                        All Types
                    </label>
                    {categories.map((cat) => (
                        <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.propertyTypes.includes(cat._id)}
                                onChange={() => handleTypeChange(cat._id)}
                                className="accent-[#4960B2] cursor-pointer"
                            />
                            {cat.name}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-semibold">Price Range</label>
                <input
                    type="range"
                    className="w-full accent-[#4960B2] cursor-pointer mb-2"
                    min="0"
                    max="1000000"
                    step="5000"
                    value={filters.price[1]}
                    onChange={(e) => setFilters({ ...filters, price: [filters.price[0], parseInt(e.target.value)], maxPrice: e.target.value })}
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="relative w-1/2">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            placeholder="Min."
                            value={filters.minPrice}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, price: [parseInt(e.target.value) || 0, filters.price[1]] })}
                            className="w-full pl-6 pr-2 py-1.5 border rounded-md outline-none"
                        />
                    </div>
                    <div className="relative w-1/2">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            placeholder="Max."
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, price: [filters.price[0], parseInt(e.target.value) || 1000000] })}
                            className="w-full pl-6 pr-2 py-1.5 border rounded-md outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-semibold">Bedrooms</label>
                <div className="flex gap-2 flex-wrap">
                    {['any', '1', '2', '3', '4', '5'].map((num) => (
                        <button
                            key={num}
                            className={`px-3 py-1.5 border rounded-full font-semibold transition-all cursor-pointer ${filters.bedrooms === num ? 'bg-[#4960B2] text-white border-[#4960B2]' : 'bg-white text-gray-500 hover:border-[#4960B2]'}`}
                            onClick={() => setFilters({ ...filters, bedrooms: num })}
                        >
                            {num === 'any' ? 'Any' : num + '+'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-semibold">Bathrooms</label>
                <div className="flex gap-2 flex-wrap">
                    {['any', '1', '2', '3', '4', '5'].map((num) => (
                        <button
                            key={num}
                            className={`px-3 py-1.5 border rounded-full font-semibold transition-all cursor-pointer ${filters.bathrooms === num ? 'bg-[#4960B2] text-white border-[#4960B2]' : 'bg-white text-gray-500 hover:border-[#4960B2]'}`}
                            onClick={() => setFilters({ ...filters, bathrooms: num })}
                        >
                            {num === 'any' ? 'Any' : num + '+'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6 flex flex-col gap-3">
                <label className="block font-semibold">Location</label>
                <select
                    className="w-full px-4 py-2.5 border rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-[#4960B2]"
                    value={filters.countryId}
                    onChange={(e) => setFilters({ ...filters, countryId: e.target.value, stateId: 'all', cityId: 'all' })}
                >
                    <option value="all">Global (Any Country)</option>
                    {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                <select
                    className="w-full px-4 py-2.5 border rounded-lg cursor-pointer disabled:opacity-50 outline-none"
                    value={filters.stateId}
                    disabled={!states.length}
                    onChange={(e) => setFilters({ ...filters, stateId: e.target.value, cityId: 'all' })}
                >
                    <option value="all">Any State</option>
                    {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>

                <select
                    className="w-full px-4 py-2.5 border rounded-lg cursor-pointer disabled:opacity-50 outline-none"
                    value={filters.cityId}
                    disabled={!cities.length}
                    onChange={(e) => setFilters({ ...filters, cityId: e.target.value })}
                >
                    <option value="all">Any City</option>
                    {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 font-semibold">Square Feet</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min."
                            value={filters.sqftMin}
                            onChange={(e) => setFilters({ ...filters, sqftMin: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded-md font-semibold outline-none"
                        />
                        <input
                            type="number"
                            placeholder="Max."
                            value={filters.sqftMax}
                            onChange={(e) => setFilters({ ...filters, sqftMax: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded-md font-semibold outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-2 font-semibold">Year Built</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={filters.yearMin}
                            onChange={(e) => setFilters({ ...filters, yearMin: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded-md font-semibold outline-none"
                        />
                        <input
                            type="number"
                            placeholder="Max"
                            value={filters.yearMax}
                            onChange={(e) => setFilters({ ...filters, yearMax: e.target.value })}
                            className="w-full px-2 py-1.5 border rounded-md font-semibold outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t pt-6">
                <button
                    className="w-full bg-[#4960B2] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    onClick={handleSearchProperties}
                >
                    <FiSearch className="text-lg" /> Search Properties
                </button>
                <div className="flex justify-start items-center text-sm">
                    <button onClick={handleResetAll} className="flex items-center gap-2 text-gray-400 hover:text-[#4960B2] font-semibold transition-colors cursor-pointer capitalize">
                        <FiRefreshCw /> Reset Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterSection;
