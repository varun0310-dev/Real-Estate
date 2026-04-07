import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import axios from "axios";
import { API_URL } from "../../config";
import { FiMapPin } from "react-icons/fi";

const libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "600px", borderRadius: "24px" };
const defaultCenter = { lat: 30.7333, lng: 76.7794 }; // Chandigarh

const MainSection = () => {
    const [selectedTab, setSelectedTab] = useState("For Sale");
    const [center, setCenter] = useState(defaultCenter);
    const [markers, setMarkers] = useState([]);
    const [hoveredMarker, setHoveredMarker] = useState(null);
    const [searchCity, setSearchCity] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(false);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const locationInputRef = useRef(null);
    const autocompleteInstance = useRef(null);
    const mapRef = useRef(null);

    // Initial Geolocation & Categories
    useEffect(() => {
        const init = async () => {
            try {
                const catRes = await axios.get(`${API_URL}/api/categories/all`);
                setCategories(catRes.data);
            } catch (e) {
                console.error("Categories fetch error", e);
            }

            fetchMarkers();

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                        setCenter(pos);

                        if (window.google) {
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode({ location: pos }, (results, status) => {
                                if (status === "OK" && results[0]) {
                                    const cityComp = results[0].address_components.find(c =>
                                        c.types.includes("locality") || c.types.includes("administrative_area_level_2")
                                    );
                                    if (cityComp) {
                                        setSearchCity(cityComp.long_name);
                                        if (locationInputRef.current) {
                                            locationInputRef.current.value = cityComp.long_name;
                                        }
                                        // Auto-trigger search with the detected city
                                        fetchMarkersWithCity(cityComp.long_name);
                                    }
                                }
                            });
                        }
                    },
                    () => console.log("User denied geolocation")
                );
            }
        };
        init();
    }, [isLoaded]);

    // Initialize Google Autocomplete
    useEffect(() => {
        if (!isLoaded || !locationInputRef.current) return;

        if (!autocompleteInstance.current && window.google) {
            autocompleteInstance.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
                types: ['(cities)'],
                fields: ["geometry", "name", "formatted_address"]
            });

            autocompleteInstance.current.addListener("place_changed", () => {
                const place = autocompleteInstance.current.getPlace();
                if (!place.geometry) return;

                const pos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };

                setCenter(pos);
                const cityName = place.name || place.formatted_address;
                setSearchCity(cityName);
                if (locationInputRef.current) {
                    locationInputRef.current.value = cityName;
                }

                if (mapRef.current) {
                    mapRef.current.panTo(pos);
                    mapRef.current.setZoom(13);
                }
            });

            locationInputRef.current.oninput = (e) => {
                setSearchCity(e.target.value);
            };
        }
    }, [isLoaded]);

    // Reactive search when tabs or categories change
    useEffect(() => {
        if (isLoaded) {
            fetchMarkers();
        }
    }, [selectedTab, selectedCategory, isLoaded]);

    const fetchMarkers = async (cityOverride) => {
        setLoading(true);
        const locationValue = cityOverride !== undefined ? cityOverride : searchCity;
        try {
            const params = {
                type: selectedTab,
                categoryId: selectedCategory,
                location: locationValue,
                q: keyword,
                limit: 100
            };
            const res = await axios.get(`${API_URL}/api/properties`, { params });
            const props = res.data.properties;

            const newMarkers = props
                .filter(p => p.latitude && p.longitude)
                .map(p => ({
                    id: p._id,
                    position: { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) },
                    title: p.title,
                    price: p.price
                }));

            setMarkers(newMarkers);

            if (newMarkers.length > 0 && window.google) {
                const bounds = new window.google.maps.LatLngBounds();
                newMarkers.forEach(m => bounds.extend(m.position));

                if (mapRef.current) {
                    if (newMarkers.length === 1) {
                        mapRef.current.panTo(newMarkers[0].position);
                        mapRef.current.setZoom(15);
                    } else {
                        mapRef.current.fitBounds(bounds);
                    }
                }
            } else if (!locationValue) {
                if (mapRef.current) mapRef.current.setZoom(12);
            }
        } catch (err) {
            console.error("Marker fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarkersWithCity = (city) => {
        fetchMarkers(city);
    };

    const handleSearch = () => {
        fetchMarkers();
    };

    const onMapLoad = (map) => {
        mapRef.current = map;
    };

    return (
        <div className="relative pb-10">
            <div className="absolute top-0 left-0 w-full h-[400px] md:h-[500px] lg:h-[750px] bg-[#E8ECFF] -z-10" />

            <div className="flex flex-col text-center pt-[77px]">
                <h1 className="font-extrabold text-[24px] md:text-[36px] lg:text-[45px] px-3 lg:leading-[64px] text-[#111111] uppercase tracking-tight">
                    Begin Your Search – Discover the
                </h1>
                <h1 className="font-extrabold text-[24px] md:text-[36px] lg:text-[45px] lg:leading-[64px] text-[#111111] uppercase tracking-tight">
                    Perfect <span className="text-[#4960B2]">Living Space</span>
                </h1>

                <div className="flex justify-center pt-12 relative px-4 lg:px-0">
                    <div className="relative w-full max-w-[1320px]">

                        {/* Reverted Search Form Overlay */}
                        <div className="absolute -top-[80px] left-1/2 -translate-x-1/2 w-[95%] max-w-[1100px] z-20">
                            <div className="flex pl-4">
                                <button
                                    className={`px-8 py-3 font-bold text-sm md:text-base cursor-pointer transition-all duration-300 rounded-t-2xl shadow-lg border-b-0 ${selectedTab === "For Sale"
                                        ? "bg-[#4960B2] text-white translate-y-[-2px]"
                                        : "bg-white text-[#4960B2] hover:bg-gray-50"
                                        }`}
                                    onClick={() => setSelectedTab("For Sale")}
                                >
                                    BUY
                                </button>
                                <button
                                    className={`px-8 py-3 font-bold text-sm md:text-base cursor-pointer transition-all duration-300 rounded-t-2xl shadow-lg border-b-0 ml-1 ${selectedTab === "For Rent"
                                        ? "bg-[#4960B2] text-white translate-y-[-2px]"
                                        : "bg-white text-[#4960B2] hover:bg-gray-50"
                                        }`}
                                    onClick={() => setSelectedTab("For Rent")}
                                >
                                    RENT
                                </button>
                            </div>

                            <div className="bg-white p-4 md:p-6 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-wrap lg:flex-nowrap items-end gap-4 border border-gray-100">
                                <div className="flex-1 min-w-[200px] relative">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                                        Location
                                    </label>
                                    <div className="relative group">
                                        <input
                                            ref={locationInputRef}
                                            type="text"
                                            placeholder="Search city, neighborhood..."
                                            className="w-full h-14 bg-gray-50 border-2 border-transparent focus:border-[#4960B2] focus:bg-white rounded-2xl px-5 text-sm md:text-base font-semibold text-gray-700 outline-none transition-all shadow-sm"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <FiMapPin />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                                        Categories
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full h-14 bg-gray-50 border-2 border-transparent focus:border-[#4960B2] focus:bg-white rounded-2xl px-5 text-sm md:text-base font-semibold text-gray-700 outline-none transition-all appearance-none cursor-pointer shadow-sm"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">
                                        Property Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        className="w-full h-14 bg-gray-50 border-2 border-transparent focus:border-[#4960B2] focus:bg-white rounded-2xl px-5 text-sm md:text-base font-semibold text-gray-700 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                <div className="w-full lg:w-auto">
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading}
                                        className="w-full lg:w-[140px] h-14 bg-[#4960B2] text-white rounded-2xl font-black text-base shadow-[0_10px_20px_rgba(73,96,178,0.3)] hover:scale-105 hover:bg-[#3b4f98] transition-all duration-300 cursor-pointer active:scale-95 disabled:bg-gray-400"
                                    >
                                        {loading ? "..." : "SEARCH"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white rounded-[32px] p-0 shadow-2xl overflow-hidden min-h-[600px]">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={center}
                                    zoom={12}
                                    onLoad={onMapLoad}
                                    options={{
                                        disableDefaultUI: true,
                                        zoomControl: true,
                                        styles: [
                                            { "featureType": "all", "elementType": "geometry.fill", "stylers": [{ "weight": "2.00" }] },
                                            { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#f7f7f7" }] }
                                        ]
                                    }}
                                >
                                    {markers.map(m => (
                                        <Marker
                                            key={m.id}
                                            position={m.position}
                                            onMouseOver={() => setHoveredMarker(m)}
                                            onMouseOut={() => setHoveredMarker(null)}
                                            onClick={() => window.open(`https://www.google.com/maps?q=${m.position.lat},${m.position.lng}`, '_blank')}
                                            label={{
                                                text: m.title?.length > 15 ? m.title.substring(0, 15) + "..." : m.title,
                                                color: "#4960B2",
                                                fontSize: "11px",
                                                fontWeight: "900",
                                                className: "marker-label bg-white px-2 py-1 rounded-full border border-[#4960B2] shadow-sm ml-[60px]"
                                            }}
                                        />
                                    ))}

                                    {hoveredMarker && (
                                        <InfoWindow
                                            position={hoveredMarker.position}
                                            onCloseClick={() => setHoveredMarker(null)}
                                            options={{
                                                pixelOffset: new window.google.maps.Size(0, -35),
                                                disableAutoPan: true
                                            }}
                                        >
                                            <div className="p-3 min-w-[180px] bg-white rounded-xl shadow-lg border-2 border-[#E8ECFF] flex flex-col gap-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="bg-[#4960B2]/10 text-[#4960B2] text-[10px] font-black uppercase px-2 py-0.5 rounded-md self-start">
                                                        Active
                                                    </span>
                                                    <span className="text-[#4960B2] font-black text-sm">
                                                        ${hoveredMarker.price?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <h3 className="text-gray-900 font-bold text-sm leading-tight mt-1">
                                                    {hoveredMarker.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                                    <FiMapPin className="text-[#4960B2]" />
                                                    Selected Location
                                                </div>
                                            </div>
                                        </InfoWindow>
                                    )}
                                </GoogleMap>
                            ) : (
                                <div className="h-[600px] w-full bg-gray-100 flex items-center justify-center rounded-[24px]">
                                    <p className="text-gray-400 italic">Initializing live map...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainSection;
