import React from 'react'

// Sample card data
const cardData = [
    {
        id: 1,
        image: './src/assets/homelogo/property-logo.svg',
        title: 'Wide Range of Properties',
        description: 'We offer expert legal help for all related property items in Dubai.',
    },
    {
        id: 2,
        image: './src/assets/homelogo/home-logo.svg',
        title: 'Buy or Rent Homes',
        description: 'We sell your home at the best market price and very quickly as well.',
    },
    {
        id: 3,
        image: './src/assets/homelogo/trusted-logo.svg',
        title: 'Trusted by Thousands',
        description: 'We offer you free consultancy to get a loan for your new home.',
    },
]

const WorkWithUs = () => {
    return (
        <div className='max-w-[1320px] mx-auto bg-white mt-20 px-4 sm:px-6 lg:px-8 mb-10 '>
            {/* Heading */}
            <div className='flex flex-col justify-center items-center text-center mb-10 px-2'>
                <h1 className='font-extrabold text-3xl sm:text-4xl md:text-[40px] leading-tight text-[#111111]'>
                    Why You Should Work With Us
                </h1>
                <p className='font-normal text-sm sm:text-base text-[#111111]/60 mt-2'>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
            </div>

            {/* Card Section */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8'>
                {cardData.map((card) => (
                    <div
                        key={card.id}
                        className='flex flex-col items-center text-center p-6 bg-[#F9FAFB] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300'
                    >
                        <img src={card.image} alt={card.title} className='mb-4 h-[60px] w-auto' />
                        <h3 className='font-medium text-lg md:text-xl text-[#111111]'>
                            {card.title}
                        </h3>
                        <p className='text-sm md:text-base text-[#111111]/60 mt-2'>
                            {card.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default WorkWithUs
