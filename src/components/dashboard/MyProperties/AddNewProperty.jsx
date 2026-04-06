import React, { useState, useEffect, useRef } from 'react'
import { HiArrowLeft, HiCloudUpload, HiChevronLeft, HiChevronRight, HiCheck } from 'react-icons/hi'
import axios from 'axios';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };
import toast from 'react-hot-toast';
import ConfirmationModal from '../Common/ConfirmationModal';
import { API_URL } from '../../../config';

const AddNewProperty = ({ onBack, propertyToEdit }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    // Form states
    const initialFormState = propertyToEdit ? {
        title: propertyToEdit.title || '',
        description: propertyToEdit.description || '',
        category: propertyToEdit.categoryId?._id || propertyToEdit.categoryId || '',
        listedIn: propertyToEdit.listedIn || 'Listed',
        propertyType: propertyToEdit.propertyType || '',
        propertyStatus: propertyToEdit.propertyStatus || 'Pending',
        price: propertyToEdit.price || '',
        yearlyTaxRate: propertyToEdit.yearlyTaxRate || '',
        afterPriceLabel: propertyToEdit.afterPriceLabel || '',
        address: propertyToEdit.address || '',
        zip: propertyToEdit.zip || '',
        neighborhood: propertyToEdit.neighborhood || '',
        latitude: propertyToEdit.latitude || '',
        longitude: propertyToEdit.longitude || '',
        size: propertyToEdit.size || '',
        lotSize: propertyToEdit.lotSize || '',
        rooms: propertyToEdit.rooms || '',
        bedrooms: propertyToEdit.bedrooms || '',
        bathrooms: propertyToEdit.bathrooms || '',
        customId: propertyToEdit.customId || '',
        garages: propertyToEdit.garages || '',
        garageSize: propertyToEdit.garageSize || '',
        yearBuilt: propertyToEdit.yearBuilt || '',
        availableFrom: propertyToEdit.availableFrom || '',
        basement: propertyToEdit.basement || '',
        extraDetails: propertyToEdit.extraDetails || '',
        roofing: propertyToEdit.roofing || '',
        exteriorMaterial: propertyToEdit.exteriorMaterial || '',
        structureType: propertyToEdit.structureType || '',
        floorsNo: propertyToEdit.floorsNo || '',
        energyClass: propertyToEdit.energyClass || '',
        energyIndex: propertyToEdit.energyIndex || ''
    } : {
        title: '',
        description: '',
        category: '',
        listedIn: 'Listed',
        propertyType: '',
        propertyStatus: 'Pending',
        price: '',
        yearlyTaxRate: '',
        afterPriceLabel: '',
        address: '',
        zip: '',
        neighborhood: '',
        latitude: '',
        longitude: '',
        size: '',
        lotSize: '',
        rooms: '',
        bedrooms: '',
        bathrooms: '',
        customId: '',
        garages: '',
        garageSize: '',
        yearBuilt: '',
        availableFrom: '',
        basement: '',
        extraDetails: '',
        roofing: '',
        exteriorMaterial: '',
        structureType: '',
        floorsNo: '',
        energyClass: '',
        energyIndex: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    const [locations, setLocations] = useState({
        countries: [],
        states: [],
        cities: []
    });

    const [selectedLocation, setSelectedLocation] = useState(propertyToEdit ? {
        country: propertyToEdit.countryId?._id || propertyToEdit.countryId || '',
        state: propertyToEdit.stateId?._id || propertyToEdit.stateId || '',
        city: propertyToEdit.cityId?._id || propertyToEdit.cityId || ''
    } : { country: '', state: '', city: '' });

    const [selectedAmenities, setSelectedAmenities] = useState(propertyToEdit?.amenities || []);
    const [mediaFiles, setMediaFiles] = useState(propertyToEdit?.images || []);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // Add your API key in .env config
        libraries: libraries
    });

    const [mapCenter, setMapCenter] = useState(propertyToEdit?.latitude && propertyToEdit?.longitude 
        ? { lat: parseFloat(propertyToEdit.latitude), lng: parseFloat(propertyToEdit.longitude) } 
        : defaultCenter
    );
    const [mapMarker, setMapMarker] = useState(propertyToEdit?.latitude && propertyToEdit?.longitude 
        ? { lat: parseFloat(propertyToEdit.latitude), lng: parseFloat(propertyToEdit.longitude) } 
        : null
    );

    const mapRef = useRef(null);
    const autocompleteInputRef = useRef(null);
    const googleMapInstance = useRef(null);
    const googleMarkerInstance = useRef(null);
    const autocompleteInstance = useRef(null);

    // Initialize Autocomplete
    useEffect(() => {
        if (!isLoaded || !autocompleteInputRef.current) return;
        
        if (!autocompleteInstance.current && window.google) {
            autocompleteInstance.current = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
                fields: ["geometry", "name", "address_components", "formatted_address"]
            });

            autocompleteInstance.current.addListener("place_changed", async () => {
                const place = autocompleteInstance.current.getPlace();
                if (!place || !place.geometry) return;

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const address = place.formatted_address || place.name;

                setMapCenter({ lat, lng });
                setMapMarker({ lat, lng });
                
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng, address }));

                let countryName = "", stateName = "";
                let locality = "", admin2 = "", admin3 = "";
                place.address_components?.forEach(component => {
                    const types = component.types;
                    if (types.includes("country")) {
                        countryName = component.long_name;
                    } else if (types.includes("administrative_area_level_1")) {
                        stateName = component.long_name;
                    } else if (types.includes("locality") || types.includes("postal_town")) {
                        locality = component.long_name;
                    } else if (types.includes("administrative_area_level_2")) {
                        admin2 = component.long_name;
                    } else if (types.includes("administrative_area_level_3")) {
                        admin3 = component.long_name;
                    }
                });

                let cityName = locality || admin3 || admin2 || "";

                let countryId = selectedLocation.country;
                let stateId = "";
                let cityId = "";
                let newStates = locations.states;
                let newCities = [];

                if (countryName) {
                    const country = locations.countries.find(c =>
                        c.name.toLowerCase() === countryName.toLowerCase() ||
                        (c.isoCode && c.isoCode.toLowerCase() === place.address_components.find(comp => comp.types.includes("country"))?.short_name.toLowerCase())
                    );
                    if (country) {
                        countryId = country._id;
                        try {
                            const statesRes = await axios.get(`${API_URL}/api/locations/states/${countryId}`);
                            newStates = statesRes.data;

                            if (stateName) {
                                const state = newStates.find(s => s.name.toLowerCase() === stateName.toLowerCase() ||
                                    (s.isoCode && s.isoCode.toLowerCase() === place.address_components.find(comp => comp.types.includes("administrative_area_level_1"))?.short_name.toLowerCase())
                                );
                                if (state) {
                                    stateId = state._id;
                                    try {
                                        const citiesRes = await axios.get(`${API_URL}/api/locations/cities/${stateId}`);
                                        newCities = citiesRes.data;

                                        if (cityName) {
                                            const normalizedCityName = cityName.toLowerCase().replace(/ city$/, '').trim();
                                            const city = newCities.find(c => {
                                                const dbCity = c.name.toLowerCase().trim();
                                                return dbCity === normalizedCityName || 
                                                       dbCity.includes(normalizedCityName) || 
                                                       normalizedCityName.includes(dbCity);
                                            });
                                            if (city) {
                                                cityId = city._id;
                                            }
                                        }
                                    } catch(e) { console.error(e); }
                                }
                            }
                        } catch(e) { console.error(e); }
                    }
                }

                setLocations(prev => ({ ...prev, states: newStates, cities: newCities }));
                setSelectedLocation({ country: countryId, state: stateId, city: cityId });
                
                const newErrors = { ...errors };
                delete newErrors.country; delete newErrors.state; delete newErrors.city;
                setErrors(newErrors);
            });
        }
    }, [isLoaded, currentStep]);

    // Initialize Map
    useEffect(() => {
        if (!isLoaded || !mapRef.current || currentStep !== 2) return;

        if (!googleMapInstance.current && window.google) {
            googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
                center: mapCenter,
                zoom: mapMarker ? 15 : 4,
                mapTypeControl: false,
                streetViewControl: false
            });

            if (mapMarker) {
                googleMarkerInstance.current = new window.google.maps.Marker({
                    position: mapMarker,
                    map: googleMapInstance.current
                });
            }

            googleMapInstance.current.addListener("click", (e) => {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setMapMarker({ lat, lng });
                setMapCenter({ lat, lng });
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            });
        }

        return () => {
            googleMapInstance.current = null;
            googleMarkerInstance.current = null;
        };
    }, [isLoaded, currentStep]);

    // Update Map and Marker when state changes
    useEffect(() => {
        if (googleMapInstance.current && window.google) {
            googleMapInstance.current.setCenter(mapCenter);
            googleMapInstance.current.setZoom(mapMarker ? 15 : 4);
            
            if (mapMarker) {
                if (!googleMarkerInstance.current) {
                    googleMarkerInstance.current = new window.google.maps.Marker({
                        position: mapMarker,
                        map: googleMapInstance.current
                    });
                } else {
                    googleMarkerInstance.current.setPosition(mapMarker);
                }
            }
        }
    }, [mapCenter, mapMarker]);

    const [availableAmenities, setAvailableAmenities] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                const [countriesRes, categoriesRes, amenitiesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/locations/countries`), // Countries stay public
                    axios.get(`${API_URL}/api/categories`, config),
                    axios.get(`${API_URL}/api/amenities`, config)
                ]);
                const countries = countriesRes.data;
                setLocations(prev => ({ ...prev, countries }));
                setCategories(categoriesRes.data.categories || categoriesRes.data);
                setAvailableAmenities(amenitiesRes.data.amenities || amenitiesRes.data);

                // If editing, fetch relevant states and cities
                if (propertyToEdit?._id) {
                    const countryId = propertyToEdit.countryId?._id || propertyToEdit.countryId;
                    const stateId = propertyToEdit.stateId?._id || propertyToEdit.stateId;

                    if (countryId) {
                        const statesRes = await axios.get(`${API_URL}/api/locations/states/${countryId}`);
                        setLocations(prev => ({ ...prev, states: statesRes.data }));
                    }
                    if (stateId) {
                        const citiesRes = await axios.get(`${API_URL}/api/locations/cities/${stateId}`);
                        setLocations(prev => ({ ...prev, cities: citiesRes.data }));
                    }
                } else {
                    // Default to India for new property
                    const india = countries.find(c => c.name === 'India' || c.isoCode === 'IN');
                    if (india) {
                        setSelectedLocation(prev => ({ ...prev, country: india._id }));
                        const statesRes = await axios.get(`${API_URL}/api/locations/states/${india._id}`);
                        setLocations(prev => ({ ...prev, states: statesRes.data }));
                    }
                }
            } catch (err) {
                console.error("Error fetching initial data:", err);
            }
        };
        fetchInitialData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            const newErrors = { ...errors };
            delete newErrors[name];
            setErrors(newErrors);
        }
    };

    const handleCountryChange = async (e) => {
        const countryId = e.target.value;
        setSelectedLocation({ country: countryId, state: '', city: '' });
        setLocations(prev => ({ ...prev, states: [], cities: [] }));

        if (countryId) {
            try {
                const response = await axios.get(`${API_URL}/api/locations/states/${countryId}`);
                setLocations(prev => ({ ...prev, states: response.data }));
            } catch (err) {
                console.error("Error fetching states:", err);
            }
        }

        // Clear errors for all location fields
        const newErrors = { ...errors };
        delete newErrors.country;
        delete newErrors.state;
        delete newErrors.city;
        setErrors(newErrors);
    };

    const handleStateChange = async (e) => {
        const stateId = e.target.value;
        setSelectedLocation(prev => ({ ...prev, state: stateId, city: '' }));
        setLocations(prev => ({ ...prev, cities: [] }));

        if (stateId) {
            try {
                const response = await axios.get(`${API_URL}/api/locations/cities/${stateId}`);
                setLocations(prev => ({ ...prev, cities: response.data }));
            } catch (err) {
                console.error("Error fetching cities:", err);
            }
        }

        const newErrors = { ...errors };
        delete newErrors.state;
        delete newErrors.city;
        setErrors(newErrors);
    };

    const handleCityChange = (e) => {
        setSelectedLocation(prev => ({ ...prev, city: e.target.value }));
        if (errors.city) {
            const newErrors = { ...errors };
            delete newErrors.city;
            setErrors(newErrors);
        }
    };

    const validateStep = (step) => {
        let stepErrors = {};
        if (step === 0) { // Description
            if (!formData.title.trim()) stepErrors.title = 'Property title is required';
            if (!formData.description.trim()) stepErrors.description = 'Description is required';
            if (!formData.category) stepErrors.category = 'Category is required';
            if (!formData.listedIn) stepErrors.listedIn = 'Listed in is required';
            if (!formData.propertyType) stepErrors.propertyType = 'Property type is required';
            if (!formData.price) stepErrors.price = 'Price is required';
            if (!formData.yearlyTaxRate.trim()) stepErrors.yearlyTaxRate = 'Yearly tax rate is required';
            if (!formData.afterPriceLabel.trim()) stepErrors.afterPriceLabel = 'After price label is required';
        } else if (step === 1) { // Media
            if (mediaFiles.length === 0) stepErrors.media = 'At least one image is required';
        } else if (step === 2) { // Location
            if (!selectedLocation.country) stepErrors.country = 'Country is required';
            if (!selectedLocation.state) stepErrors.state = 'State is required';
            if (!selectedLocation.city) stepErrors.city = 'City is required';
        }
        return stepErrors;
    };

    const isStepComplete = (step) => {
        if (step === 0) {
            return formData.title.trim() !== '' && 
                   formData.description.trim() !== '' && 
                   formData.category !== '' && 
                   formData.listedIn !== '' && 
                   formData.propertyType !== '' && 
                   formData.price !== '' && 
                   formData.yearlyTaxRate.trim() !== '' && 
                   formData.afterPriceLabel.trim() !== '';
        }
        if (step === 1) {
            return mediaFiles.length > 0;
        }
        if (step === 2) {
            return selectedLocation.country !== '' && selectedLocation.state !== '' && selectedLocation.city !== '';
        }
        return true; // Other steps are optional for now
    };

    const validateAll = () => {
        let allErrors = {};
        // Check all steps
        for (let i = 0; i < steps.length; i++) {
            const stepErrors = validateStep(i);
            allErrors = { ...allErrors, ...stepErrors };
        }

        setErrors(allErrors);

        if (Object.keys(allErrors).length > 0) {
            // Find first step with errors
            if (allErrors.title || allErrors.category || allErrors.price) setCurrentStep(0);
            else if (allErrors.country || allErrors.state || allErrors.city) setCurrentStep(2);

            toast.error('Please fill all required fields');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        const stepErrors = validateStep(currentStep);
        if (Object.keys(stepErrors).length > 0) {
            setErrors({ ...errors, ...stepErrors });
            toast.error('Please fill required fields');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const handleSubmitClick = () => {
        if (validateAll()) {
            setIsConfirmModalOpen(true);
        }
    };

    const confirmSave = async () => {
        setIsConfirmModalOpen(false);
        setLoading(true);
        try {
            const formDataObj = new FormData();
            Object.keys(formData).forEach(key => {
                formDataObj.append(key, formData[key]);
            });
            formDataObj.append('countryId', selectedLocation.country);
            formDataObj.append('stateId', selectedLocation.state);
            formDataObj.append('cityId', selectedLocation.city);
            
            selectedAmenities.forEach(amenity => {
                formDataObj.append('amenities', amenity);
            });
            
            mediaFiles.forEach(file => {
                formDataObj.append('images', file);
            });

            // Note: Since backend schema is slightly different (name vs title, coordinates), 
            // the real API might need mapping, but I'll use the current structure for now as a demo.
            if (propertyToEdit?._id) {
                // UPDATE Existing
                const updatePayload = {
                    ...formData,
                    countryId: selectedLocation.country,
                    stateId: selectedLocation.state,
                    cityId: selectedLocation.city,
                    categoryId: formData.category, // Map category field correctly
                    amenities: selectedAmenities
                };

                await axios.put(`${API_URL}/api/properties/${propertyToEdit._id}`, updatePayload, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else {
                // CREATE New
                await axios.post(`${API_URL}/api/properties`, formDataObj, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
            }

            toast.success(propertyToEdit?._id ? 'Property updated successfully!' : 'Property saved successfully!');
            setTimeout(() => onBack(), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving property');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { label: 'Description', icon: '1' },
        { label: 'Media', icon: '2' },
        { label: 'Location', icon: '3' },
        { label: 'Detail', icon: '4' },
        { label: 'Amenities', icon: '5' }
    ];

    const handleStepClick = (index) => {
        if (index < currentStep) {
            // Always allow going back
            setCurrentStep(index);
        } else if (index > currentStep) {
            // Validate intermediate steps if moving forward
            for (let i = currentStep; i < index; i++) {
                const stepErrors = validateStep(i);
                if (Object.keys(stepErrors).length > 0) {
                    setErrors({ ...errors, ...stepErrors });
                    toast.error(`Please complete Step ${i + 1} first`);
                    setCurrentStep(i);
                    return;
                }
            }
            setCurrentStep(index);
        }
    };

    return (
        <div className="p-6 bg-[#f5f6fa] min-h-screen">
            <div className='flex items-center mb-6' >
                <button
                    onClick={onBack}
                    className="flex items-center text-[#3f51b5] font-medium hover:underline cursor-pointer group"
                >
                    <HiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={20} />
                    <span>Back to Properties</span>
                </button>
                <div className="ml-auto flex-1 text-center pr-20">
                    <h1 className="text-2xl font-black text-[#1e1e2d] tracking-tight">
                        {propertyToEdit ? 'Edit Property' : 'Add New Property'}
                    </h1>
                </div>
            </div>

            {/* Stepper Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between relative">
                    {/* Progress Track */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-[#3f51b5] -translate-y-1/2 z-0 transition-all duration-500 hidden md:block"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step, index) => (
                        <div
                            key={step.label}
                            onClick={() => handleStepClick(index)}
                            className="relative z-10 flex flex-col items-center cursor-pointer group"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${index <= currentStep
                                    ? 'bg-[#3f51b5] text-white shadow-lg shadow-blue-200 scale-110'
                                    : 'bg-white text-gray-400 border-2 border-gray-200 group-hover:border-[#3f51b5] group-hover:text-[#3f51b5]'
                                    }`}
                            >
                                {index < currentStep ? <HiCheck size={20} /> : step.icon}
                            </div>
                            <span className={`mt-2 text-xs font-bold uppercase tracking-wider hidden md:block transition-colors ${index <= currentStep ? 'text-[#3f51b5]' : 'text-gray-400 group-hover:text-[#3f51b5]'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto border border-gray-100 mb-20 animate-fadeIn">

                {/* Step 0: Description */}
                {currentStep === 0 && (
                    <div className="animate-slideIn">
                        <h2 className="text-xl font-bold text-[#1e1e2d] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#3f51b5] rounded-full"></span>
                            Property description
                        </h2>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.title ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                placeholder="e.g. Luxury Apartment with Sea View"
                            />
                            {errors.title && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.title}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                            <textarea
                                rows={6}
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl resize-none text-sm transition-all`}
                                placeholder="Describe the key features, neighborhood, and unique selling points..."
                            ></textarea>
                            {errors.description && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.category ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.category}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Listed In <span className="text-red-500">*</span></label>
                                <select
                                    name="listedIn"
                                    value={formData.listedIn}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.listedIn ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                >
                                    <option value="">Select option</option>
                                    <option value="Listed">Listed</option>
                                    <option value="Unlisted">Unlisted</option>
                                </select>
                                {errors.listedIn && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.listedIn}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Property Type <span className="text-red-500">*</span></label>
                                <select
                                    name="propertyType"
                                    value={formData.propertyType}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.propertyType ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                >
                                    <option value="">Select Type</option>
                                    <option value="For Rent">For Rent</option>
                                    <option value="For Sale">For Sale</option>
                                </select>
                                {errors.propertyType && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.propertyType}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Price ($) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.price ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                    placeholder="8930"
                                />
                                {errors.price && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.price}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Yearly Tax Rate <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="yearlyTaxRate"
                                    value={formData.yearlyTaxRate}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.yearlyTaxRate ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                    placeholder="5%"
                                />
                                {errors.yearlyTaxRate && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.yearlyTaxRate}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">After Price Label <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="afterPriceLabel"
                                    value={formData.afterPriceLabel}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.afterPriceLabel ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} focus:outline-none focus:ring-2 focus:ring-[#3f51b5] rounded-xl text-sm transition-all`}
                                    placeholder="Monthly"
                                />
                                {errors.afterPriceLabel && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.afterPriceLabel}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 1: Media */}
                {currentStep === 1 && (
                    <div className="animate-slideIn">
                        <h2 className="text-xl font-bold text-[#1e1e2d] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#3f51b5] rounded-full"></span>
                            Property Media
                        </h2>

                        <div className="border-2 border-dashed border-[#3f51b5] border-opacity-30 bg-blue-50 bg-opacity-30 rounded-2xl p-12 text-center mb-8 hover:bg-opacity-50 transition-all cursor-pointer group relative">
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={async (e) => {
                                    if(e.target.files && e.target.files.length > 0) {
                                        const files = Array.from(e.target.files);
                                        const validFiles = [];
                                        
                                        for (const file of files) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error(`Image ${file.name} exceeds 5MB size limit.`);
                                                continue;
                                            }
                                            
                                            validFiles.push(file);
                                        }

                                        if (validFiles.length > 0) {
                                            const fd = new FormData();
                                            validFiles.forEach(f => fd.append('images', f));
                                            
                                            try {
                                                const res = await axios.post(`${API_URL}/api/properties/upload`, fd, {
                                                    headers: { 
                                                        Authorization: `Bearer ${localStorage.getItem('token')}`
                                                    }
                                                });
                                                if(res.data && res.data.images) {
                                                    setMediaFiles(prev => [...prev, ...validFiles]);
                                                    toast.success('Images uploaded to server');
                                                }
                                            } catch(err) {
                                                toast.error('Failed to upload images');
                                            }
                                        }
                                        e.target.value = ''; // Reset input to allow adding the same file again if needed
                                    }
                                }} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            />
                            <div className="flex flex-col items-center justify-center text-[#3f51b5]">
                                <HiCloudUpload size={64} className="mb-4 group-hover:scale-110 transition-transform duration-300" />
                                <p className="text-lg font-bold">Upload Property Photos</p>
                                <p className="text-sm opacity-70 mt-2 max-w-sm mx-auto">
                                    Drag and drop or click to upload. Max size 5MB per image. Recommended resolution 1920x1080.
                                </p>
                            </div>
                        </div>

                        {mediaFiles.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {mediaFiles.map((file, index) => (
                                    <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video group shadow-sm bg-gray-100">
                                        <img 
                                            src={file instanceof File ? URL.createObjectURL(file) : `${API_URL}${file}`} 
                                            alt="preview" 
                                            className="w-full h-full object-cover" 
                                        />
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMediaFiles(prev => prev.filter((_, i) => i !== index));
                                            }}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Video Provider</label>
                                <select className="w-full px-4 py-3 border border-gray-200 bg-[#f8fafc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]">
                                    <option>Youtube</option>
                                    <option>Vimeo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Embed Video URL</label>
                                <input
                                    type="text"
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full px-4 py-3 border border-gray-200 bg-[#f8fafc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]"
                                />
                            </div>
                        </div>
                        */}
                    </div>
                )}

                {/* Step 2: Location */}
                {currentStep === 2 && (
                    <div className="animate-slideIn">
                        <h2 className="text-xl font-bold text-[#1e1e2d] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#3f51b5] rounded-full"></span>
                            Property Location
                        </h2>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                            {isLoaded ? (
                                <input
                                    ref={autocompleteInputRef}
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="123 Luxury Lane, Downtown"
                                    className="w-full px-4 py-3 border border-gray-200 bg-[#f8fafc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]"
                                />
                            ) : (
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Loading Maps..."
                                    className="w-full px-4 py-3 border border-gray-200 bg-[#f8fafc] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]"
                                    disabled
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`w-full px-4 py-3 border ${errors.country ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5] transition-all`}
                                    value={selectedLocation.country}
                                    onChange={handleCountryChange}
                                >
                                    <option value="">Select Country</option>
                                    {locations.countries.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                                {errors.country && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.country}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`w-full px-4 py-3 border ${errors.state ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5] transition-all`}
                                    value={selectedLocation.state}
                                    onChange={handleStateChange}
                                    disabled={!selectedLocation.country}
                                >
                                    <option value="">Select State</option>
                                    {locations.states.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                                {errors.state && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.state}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className={`w-full px-4 py-3 border ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-[#f8fafc]'} rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5] transition-all`}
                                    value={selectedLocation.city}
                                    onChange={handleCityChange}
                                    disabled={!selectedLocation.state}
                                >
                                    <option value="">Select City</option>
                                    {locations.cities.map(ct => (
                                        <option key={ct._id} value={ct._id}>{ct.name}</option>
                                    ))}
                                </select>
                                {errors.city && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{errors.city}</p>}
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-2xl overflow-hidden h-[400px] relative">
                            {!isLoaded ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50 backdrop-blur-[2px]">
                                    <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                                        <p className="text-sm font-bold text-[#1e1e2d]">Loading Map...</p>
                                        <p className="text-xs text-gray-500 mt-1">Please wait</p>
                                    </div>
                                </div>
                            ) : (
                                <div ref={mapRef} style={mapContainerStyle} className="w-full h-full bg-gray-200" />
                            )}

                            {formData.latitude && formData.longitude && (
                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-gray-100 flex gap-4 text-xs font-semibold text-gray-600">
                                    <p>Lat: <span className="text-[#3f51b5]">{Number(formData.latitude).toFixed(4)}</span></p>
                                    <p>Lng: <span className="text-[#3f51b5]">{Number(formData.longitude).toFixed(4)}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Detail */}
                {currentStep === 3 && (
                    <div className="animate-slideIn">
                        <h2 className="text-xl font-bold text-[#1e1e2d] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#3f51b5] rounded-full"></span>
                            Listing Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Size (sq ft)</label>
                                <input type="number" name="size" value={formData.size} onChange={handleChange} placeholder="2400" className="w-full border border-gray-200 bg-[#f8fafc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Bedrooms</label>
                                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} placeholder="3" className="w-full border border-gray-200 bg-[#f8fafc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Bathrooms</label>
                                <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} placeholder="2" className="w-full border border-gray-200 bg-[#f8fafc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Year Built</label>
                                <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} placeholder="2022" className="w-full border border-gray-200 bg-[#f8fafc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Garages</label>
                                <input type="number" name="garages" value={formData.garages} onChange={handleChange} placeholder="1" className="w-full border border-gray-200 bg-[#f8fafc] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3f51b5]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Amenities */}
                {currentStep === 4 && (
                    <div className="animate-slideIn">
                        <h2 className="text-xl font-bold text-[#1e1e2d] mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#3f51b5] rounded-full"></span>
                            Select Amenities
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                            {availableAmenities.length > 0 ? (
                                availableAmenities.map((amenity) => (
                                    <label
                                        key={amenity._id}
                                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedAmenities.includes(amenity._id)
                                            ? 'bg-blue-50 border-[#3f51b5] text-[#3f51b5]'
                                            : 'bg-[#f8fafc] border-gray-100 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={selectedAmenities.includes(amenity._id)}
                                            onChange={() => {
                                                if (selectedAmenities.includes(amenity._id)) {
                                                    setSelectedAmenities(selectedAmenities.filter(id => id !== amenity._id));
                                                } else {
                                                    setSelectedAmenities([...selectedAmenities, amenity._id]);
                                                }
                                            }}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedAmenities.includes(amenity._id) ? 'bg-[#3f51b5] border-[#3f51b5]' : 'bg-white border-gray-300'
                                            }`}>
                                            {selectedAmenities.includes(amenity._id) && <HiCheck className="text-white" size={14} />}
                                        </div>
                                        <span className="font-bold">{amenity.name}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-full py-4 text-center">No amenities found. Please add amenities from the dashboard.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Stepper Footer */}
                <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                    <div>
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                            >
                                <HiChevronLeft size={20} />
                                Previous
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {currentStep < steps.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepComplete(currentStep)}
                                className={`flex items-center gap-2 px-10 py-3 rounded-xl font-bold transition-all shadow-lg ${isStepComplete(currentStep)
                                    ? 'bg-[#3f51b5] text-white hover:bg-[#334296] hover:-translate-y-0.5 active:translate-y-0 shadow-blue-100 cursor-pointer'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                Next Step
                                <HiChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitClick}
                                disabled={loading}
                                className="bg-[#1e2d5c] text-white px-12 py-3 rounded-xl font-black hover:bg-[#152042] transition-all hover:-translate-y-1 shadow-2xl shadow-blue-200 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Submit Property'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                title={propertyToEdit?._id ? "Confirm Update" : "Confirm Submission"}
                message={propertyToEdit?._id ? "Are you sure you want to update this property listing? Please double check all the details before proceeding." : "Are you sure you want to save this property listing? Please double check all the details before proceeding."}
                onConfirm={confirmSave}
                onCancel={() => setIsConfirmModalOpen(false)}
                confirmText={propertyToEdit?._id ? "Update Now" : "Submit"}
                confirmColor="bg-[#1e2d5c] hover:bg-[#152042]"
                icon={<HiCheck className="h-6 w-6 text-emerald-600" />}
                iconBg="bg-emerald-100"
            />

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .animate-slideIn {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    )
}

export default AddNewProperty
