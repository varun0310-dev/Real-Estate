import React from 'react';

const DownloadApp = () => {
    return (
        <div className='max-w-[1320px] mx-auto pt-10 pb-20 p-3 md:px-6 '>
            <div className='flex flex-col lg:flex-row items-stretch justify-between bg-[#ffffff] rounded-xl overflow-hidden'>

                {/* Left Section - Text Content */}
                <div className='w-full lg:w-1/2 bg-[#4960B2] p-3 md:p-10 flex flex-col justify-center'>
                    <button className='bg-[#5B70BA] px-5 py-2 text-sm text-white rounded-full mb-4 w-fit'>
                        Start today
                    </button>
                    <h1 className='text-[20px] md:text-4xl font-semibold text-white mb-4'>
                        Download the App
                    </h1>
                    <p className='text-white text-[12px] md:text-[16px] leading-relaxed mb-6'>
                        Find your perfect home on the go. Download our real estate app from the App Store or Google Play to browse, rent, or buy properties anytime, anywhere — fast, simple, and hassle-free.
                    </p>
                    <div className='flex gap-4 flex-wrap'>
                        <img
                            src="./src/assets/homelogo/appstore.svg"
                            alt="App Store"
                            className=' h-8 md:h-12  '
                        />
                        <img
                            src="./src/assets/homelogo/playstore.svg"
                            alt="Google Play"
                            className=' h-8 md:h-12'
                        />
                    </div>
                </div>

                {/* Right Section - Image */}
                <div className='w-full lg:w-1/2 h-full lg:h-[337px] '>
                    <img
                        src="./src/assets/homelogo/download-img.svg"
                        alt="App Preview"
                        className='w-full h-full object-cover'
                    />
                </div>

            </div>
        </div>
    );
};

export default DownloadApp;
