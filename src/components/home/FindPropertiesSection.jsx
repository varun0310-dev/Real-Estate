import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';

const FindPropertiesSection = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mapping city names to local assets
  const getCityIcon = (cityName) => {
    const name = cityName.toLowerCase();
    if (name.includes('bangalore')) return './src/assets/homelogo/banglore.svg';
    if (name.includes('mumbai')) return './src/assets/homelogo/mumbai.svg';
    if (name.includes('delhi')) return './src/assets/homelogo/delhi.svg';
    if (name.includes('hyderabad') || name.includes('puna')) return './src/assets/homelogo/hyderabad.svg'; // Default/Shared for some
    if (name.includes('pune')) return './src/assets/homelogo/puna.svg';
    if (name.includes('kolkata')) return './src/assets/homelogo/kolkata.svg';
    if (name.includes('chandigarh')) return './src/assets/homelogo/Chandigarh.svg';
    if (name.includes('rajasthan')) return './src/assets/homelogo/Rajasthan.svg';
    
    // Fallback Icon (Bangalore is often used as a flagship)
    return './src/assets/homelogo/banglore.svg';
  };

  useEffect(() => {
    const fetchCityCounts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/locations/cities-with-counts`);
        setCities(res.data);
      } catch (err) {
        console.error('Error fetching city counts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCityCounts();
  }, []);

  if (loading && cities.length === 0) {
    return (
      <div className="my-12 px-4 mx-auto max-w-[1320px] text-center">
        <p className="text-gray-400 animate-pulse font-medium">Loading destination cities...</p>
      </div>
    );
  }

  if (cities.length === 0) return null;

  return (
    <div className="my-12 px-4 mx-auto max-w-[1320px] bg-[#ffffff] ">
      {/* Header section */}
      <div className="text-center md:text-left">
        <h1 className="font-[800] text-[28px] md:text-[40px] leading-tight text-[#1A1A1A]">
          Find Properties in These Cities
        </h1>
        {/* <p className="font-[400] text-[14px] md:text-[16px] leading-[24px] md:leading-[32px] text-[#111111] mt-2">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p> */}
      </div>

      {/* Card section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
        {cities.map((city, index) => (
          <div
            key={city._id || index}
            className="flex flex-col sm:flex-row border border-[#E9E9E9] rounded-[10px] w-full min-h-[132px] p-3 gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.location.href = `/properties?cityId=${city._id}`}
          >
            <div className="w-[60px] sm:w-[100px] flex items-center justify-center">
              <img
                src={getCityIcon(city.name)}
                alt={city.name}
                className="rounded-md w-full h-auto object-contain max-h-[80px]"
                onError={(e) => { e.target.src = './src/assets/homelogo/banglore.svg'; }}
              />
            </div>
            <div className="flex flex-col justify-center text-start space-y-1 sm:space-y-1">
              <p className="font-[600] text-[18px] sm:text-[20px] lg:text-[22px] leading-[24px] text-[#000000] truncate">
                {city.name}
              </p>
              <p className="font-[500] text-[14px] sm:text-[15px] lg:text-[16px] leading-[20px] text-[#B5B5B5]">
                {city.count.toLocaleString()}+ Properties
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FindPropertiesSection;
