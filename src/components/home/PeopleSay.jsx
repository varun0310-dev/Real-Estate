'use client';
import React, { useEffect, useState } from 'react';

const testimonials = [
    {
        id: 1,
        message:
            'At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        image: './src/assets/homelogo/thomas.svg',
        name: 'Thomas Andrew',
        role: 'Owner Delhi',
    },
    {
        id: 2,
        message:
            'At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        image: './src/assets/homelogo/thomas.svg',
        name: 'Thomas Andrew',
        role: 'Owner Gujrat',
    },
    {
        id: 3,
        message:
            'At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        image: './src/assets/homelogo/thomas.svg',
        name: 'Thomas Andrew',
        role: 'Owner Hydrabad',
    },
    {
        id: 4,
        message:
            'At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        image: './src/assets/homelogo/thomas.svg',
        name: 'Thomas Andrew',
        role: 'Owner Mumbai',
    },
    {
        id: 5,
        message:
            'At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        image: './src/assets/homelogo/thomas.svg',
        name: 'Thomas Andrew',
        role: 'Owner Puna',
    },
    {
        id: 6,
        message:
            'At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt. At the training eclorem sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
        image: './src/assets/homelogo/thomas.svg',
        name: 'Thomas Andrew',
        role: 'Owner Himachal',
    },
];

const PeopleSay = () => {
    const [cardsPerView, setCardsPerView] = useState(3);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 1️⃣ Update cardsPerView on screen resize
    const updateCardsPerView = () => {
        const width = window.innerWidth;
        if (width < 776) {
            setCardsPerView(1); // < md
        } else if (width < 1160) {
            setCardsPerView(2); // < lg
        } else {
            setCardsPerView(3); // >= lg
        }
    };

    useEffect(() => {
        updateCardsPerView(); // on mount
        window.addEventListener('resize', updateCardsPerView);
        return () => window.removeEventListener('resize', updateCardsPerView);
    }, []);

    // 2️⃣ Auto-slide logic
    const maxIndex = testimonials.length - cardsPerView;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, [cardsPerView, maxIndex]);

    // 3️⃣ Slice array based on dynamic cardsPerView
    const paginatedTestimonials = testimonials.slice(
        currentIndex,
        currentIndex + cardsPerView
    );

    return (
        <div className="max-w-[1320px] mx-auto px-4 py-10">
            {/* Header */}
            <div className="text-center max-w-[800px] mx-auto mb-12">
                <h1 className="text-[32px] md:text-[40px] font-bold text-[#111111] mb-4">
                    What People Say
                </h1>
                <p className="text-sm md:text-base text-[#111]/60 font-normal leading-[26px]">
                    Real Estate Property experts provide buildings on land, along with its natural
                    resources such as crops, minerals, or water.
                </p>
            </div>

            {/* Testimonials */}
            <div className="flex flex-wrap justify-center gap-6 mb-8 transition-all duration-500">
                {paginatedTestimonials.map((testimonial) => (
                    <div
                        key={testimonial.id}
                        className="max-w-[360px] w-full bg-white rounded-[12px] px-6 py-8 text-center shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    >
                        <div className="flex justify-center items-center pb-3">
                            <svg width="37" height="27" viewBox="0 0 37 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.5 0H0.5V27L14.5 14V0Z" fill="#111111" />
                                <path d="M36.5 0H22.5V27L36.5 14V0Z" fill="#111111" />
                            </svg>
                        </div>
                        <p className="text-[14px] text-[#111] leading-[24px] mb-6">
                            {testimonial.message}
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <img src="./src/assets/homelogo/star.svg" alt="rating" className="w-[100px] h-auto" />
                            <div className="flex items-center gap-3 mt-3">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-[40px] h-[40px] rounded-full object-cover"
                                />
                                <div className="text-left">
                                    <h3 className="text-[14px] font-bold text-[#111]">{testimonial.name}</h3>
                                    <p className="text-[12px] text-[#111]/60">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center items-center gap-3">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                    <span
                        key={i}
                        className={`w-3 h-3 rounded-full inline-block cursor-pointer transition-all duration-300 ${i === currentIndex ? 'bg-[#111]' : 'bg-gray-300'}`}
                        onClick={() => setCurrentIndex(i)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

export default PeopleSay;
