import React from 'react';

const propertyData = [
    {
        id: 1,
        image: './src/assets/homelogo/selling-logo.svg',
        title: 'Get Started with Buying & Selling',
        description:
            "Whether you're looking to find your dream home or list your property for the right buyer, our platform makes the process simple and seamless. Join today to explore the latest listings, connect with trusted buyers and sellers, and manage everything in one place — all with just a few clicks.",
    },
    {
        id: 2,
        image: './src/assets/homelogo/sale-logo.svg',
        title: 'Complete Support from Search to Sale',
        description:
            "After you’ve shortlisted a property, Reliable Authentication Space steps in to ensure you have everything you need to make a confident decision. Our experienced team supports you throughout the entire journey — from scheduling property visits to handling negotiations — making the process simple and stress-free.",
    },
    {
        id: 3,
        image: './src/assets/homelogo/right-deal-logo.svg',
        title: 'Find the Right Deal for You',
        description:
            "We understand that every buyer has unique needs. That’s why we help you explore options that truly match your preferences and budget — ensuring you get the most value with expert support every step of the way.",
    },
];

const PostYourProperty = () => {
    return (
        <div className="max-w-[1320px] mx-auto px-4 py-16">

            <div className="bg-gradient-to-r from-[#302C7E] to-[#4960B2] rounded-[12px] flex flex-col md:flex-row overflow-hidden">

                {/* Text Section with Padding */}
                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
                    <h1 className="text-white text-[24px] md:text-[36px] font-extrabold mb-4 leading-tight">
                        Post Your Property for Free Today!
                    </h1>
                    <p className="text-white text-[14px] md:text-[16px] leading-relaxed mb-6">
                        Get your property seen by the right people—fast and free.
                    </p>
                    <button className="bg-white text-[#4960B2] font-semibold px-6 py-2 rounded-lg w-fit">
                        Post Your Property Now
                    </button>
                </div>

                {/* Image Section without extra padding */}
                <div className="w-full md:w-1/2 flex justify-center items-end">
                    <img
                        src="./src/assets/homelogo/free-property.svg"
                        alt="house"
                        className="h-[80%]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10 ">
                {propertyData.map((item) => (
                    <div
                        key={item.id}
                        className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_30px_rgba(0,0,0,0.15)] transition-shadow duration-300 flex flex-col items-center text-center"
                    >
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-16 h-16 object-contain mb-4"
                        />
                        <h2 className="text-xl font-semibold text-[#111111] mb-3">
                            {item.title}
                        </h2>
                        <p className="text-[#555] text-[15px] leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PostYourProperty;
