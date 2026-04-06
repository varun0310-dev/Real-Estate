import React, { useState } from 'react';
import { FiFilter } from 'react-icons/fi';
import FilterSection from './FilterSection';

const HeaderSection = () => {
    const [showFilter, setShowFilter] = useState(false);

    const toggleFilter = () => setShowFilter((prev) => !prev);
    const closeFilter = () => setShowFilter(false);

    return (
        <div className='max-w-[1320px] mx-auto p-6 space-y-1 flex justify-between'>
            <div>
                {/* <h1 className='font-[600] text-[16px] md:text-[36px] text-[#000000]'>New York Homes for Sale</h1> */}
                <p className='font-[400] text-[14px] md:text-[16px] text-gray-600'>Home / Properties</p>
            </div>
            <div className="relative block lg:hidden">
                <button
                    onClick={toggleFilter}
                    className="flex items-center gap-2 px-3 md:px-6 py-1 md:py-3 rounded-full bg-white shadow-md text-[#111827] font-medium text-[12px] md:text-[16px]"
                >
                    <FiFilter className=" text-[14px] md:text-[20px]" />
                    Filter
                </button>

                {showFilter && (
                    <FilterSection show={showFilter} onClose={closeFilter} />
                )}
            </div>
        </div>
    );
};

export default HeaderSection;
