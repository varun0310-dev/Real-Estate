import React from 'react';

const commercialProperties = [
    {
        id: 1,
        image: './src/assets/homelogo/comercial-property.svg',
        label: 'Buy Buy for Commercial USA',
        title: 'Perfect Commercial Property',
        description:
            'Discover a Full Spectrum of Spaces – From Offices and Co-Working to Retail Shops, Factories & More',
    },
    {
        id: 2,
        image: './src/assets/homelogo/comercial-space.svg',
        label: 'Buy Commercial in Canada',
        title: 'Ideal Workspace Solutions',
        description:
            'Explore a variety of commercial real estate options tailored for productivity and convenience.',
    },
];

const CommercialSpaces = () => {
    return (
        <div className="max-w-[1320px] mx-auto bg-white mt-10 mb-10 px-4">
            {/* Header */}
            <div className="text-center mb-10 px-2">
                <h1 className="font-extrabold text-2xl md:text-4xl leading-tight">
                    Explore a Diverse Range of
                </h1>
                <h1 className="font-extrabold text-2xl md:text-4xl leading-tight">
                    Commercial Spaces
                </h1>
                <p className="text-base text-gray-600 mt-4">
                    Unlock the financial resources essential for turning your concept into a market-leading business. With Wesharks, you
                </p>
                <p className="text-base text-gray-600">
                    gain access to a vast network of investors eager to back the next big thing.
                </p>
            </div>

            {/* Cards */}
          <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-10">
    {commercialProperties.map((property) => (
        <div
            key={property.id}
            className="relative rounded-xl overflow-hidden w-full max-w-[600px]"
        >
            <img
                src={property.image}
                alt={property.title}
                className="w-full h-auto object-cover"
            />
            {/* Combined Content Wrapper */}
            <div className="absolute bottom-5 left-5 right-5 flex justify-between">
                {/* Text Content */}
                <div className="bg-white rounded-tr-2xl rounded-tl-2xl rounded-bl-2xl p-4 shadow-lg flex-1">
                    <p className="uppercase text-sm font-semibold text-gray-600 mb-1">
                        {property.label}
                    </p>
                    <h2 className="text-[14px] md:text-xl font-bold text-black mb-1">
                        {property.title}
                    </h2>
                    <p className="text-sm text-gray-500 hidden sm:block">
                        {property.description}
                    </p>
                </div>
                {/* Icon Button */}
                <div className="bg-white rounded-tr-2xl rounded-tl-2xl rounded-br-2xl p-4  flex ">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 7l-10 10m0-10h10v10"
                        />
                    </svg>
                </div>
            </div>
        </div>
    ))}
</div>

        </div>
    );
};

export default CommercialSpaces;
