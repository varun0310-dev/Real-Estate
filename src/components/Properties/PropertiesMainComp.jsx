import React, { useState, useEffect } from 'react';
import FilterSection from './FilterSection';
import PropertiesSection from './PropertiesSection';
import { useSearchParams } from 'react-router-dom';

const PropertiesMainComp = () => {
    const [searchParams] = useSearchParams();
    const urlLocation = searchParams.get('location') || '';
    const urlCityId = searchParams.get('cityId') || 'all';

    // Pendings filters being edited in the sidebar
    const [filters, setFilters] = useState({
        query: '',
        status: 'all',
        propertyTypes: ['all'],
        price: [0, 1000000],
        minPrice: '',
        maxPrice: '',
        bedrooms: 'any',
        bathrooms: 'any',
        location: urlLocation,
        countryId: 'all',
        stateId: 'all',
        cityId: urlCityId,
        sqftMin: '',
        sqftMax: '',
        yearMin: '',
        yearMax: ''
    });

    // Active filters used for API fetching
    const [activeFilters, setActiveFilters] = useState(filters);

    // Sync filters if URL param changes
    useEffect(() => {
        const loc = searchParams.get('location') || '';
        const cid = searchParams.get('cityId') || 'all';
        
        if (loc !== filters.location || cid !== filters.cityId) {
            const updatedFilters = { ...filters, location: loc, cityId: cid };
            setFilters(updatedFilters);
            setActiveFilters(updatedFilters);
        }
    }, [searchParams]);

    const handleSearch = (currentFilters = filters) => {
        setActiveFilters({ ...currentFilters });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleReset = () => {
        const resetData = {
            query: '',
            status: 'all',
            propertyTypes: ['all'],
            price: [0, 1000000],
            minPrice: '',
            maxPrice: '',
            bedrooms: 'any',
            bathrooms: 'any',
            location: '',
            countryId: 'all',
            stateId: 'all',
            cityId: 'all',
            sqftMin: '',
            sqftMax: '',
            yearMin: '',
            yearMax: ''
        };
        setFilters(resetData);
        setActiveFilters({ ...resetData });
    };

    return (
        <div className="flex max-w-[1320px] mx-auto overflow-visible relative">
            <FilterSection filters={filters} setFilters={setFilters} onSearch={handleSearch} onReset={handleReset} />
            <PropertiesSection filters={activeFilters} />
        </div>
    );
};

export default PropertiesMainComp;
