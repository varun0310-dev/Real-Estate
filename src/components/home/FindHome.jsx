import React from 'react';

const FindHome = () => {
    return (
        <div className="relative w-full pt-10 pb-10 ">
            {/* Background Image */}
            <img
                src="./src/assets/homelogo/home-bg.svg"
                alt="bg-image"
                className="w-full h-full object-cover"
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className=" text-[16px] md:text-[50px] font-extrabold leading-tight tracking-wide drop-shadow-md">
                    Find the Home That <br className='hidden md:block' /> Feels Right
                </h1>
                <p className="max-w-[600px] text-[12px] md:text-[20px] font-[400] mt-2 mb-6 drop-shadow-sm">
                    Pellentesque egestas elementum egestas faucibus sem. Velit nunc egestas ut morbi. Leo diam diam.
                </p>

                <div className="bg-white flex items-center gap-2 text-black px-3 md:px-6 py-1 md:py-3 rounded-full font-medium hover:bg-gray-200 transition-all duration-200 shadow-sm">
                    <button className="focus:outline-none text-[12px] md:text-[16px]  ">
                        View Properties
                    </button>
                    <svg width="12" height="12" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_184_19816)">
                            <path d="M1.01612 6.61332H13.0268L8.4277 2.23407C8.18687 2.00475 8.17754 1.62377 8.40692 1.38302C8.636 1.14257 9.0171 1.13294 9.25822 1.36225L14.5106 6.36384C14.7378 6.59134 14.8633 6.89349 14.8633 7.21519C14.8633 7.53659 14.7378 7.83903 14.5 8.07647L9.25792 13.0679C9.14143 13.1788 8.99212 13.2339 8.84281 13.2339C8.68386 13.2339 8.52492 13.1713 8.40662 13.0471C8.17724 12.8063 8.18657 12.4256 8.42739 12.1963L13.0457 7.81707H1.01612C0.683782 7.81707 0.414062 7.54743 0.414062 7.21519C0.414062 6.88296 0.683782 6.61332 1.01612 6.61332Z" fill="#111111" />
                        </g>
                        <defs>
                            <clipPath id="clip0_184_19816">
                                <rect width="15" height="12.84" fill="white" transform="translate(0.138672 0.794922)" />
                            </clipPath>
                        </defs>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default FindHome;
