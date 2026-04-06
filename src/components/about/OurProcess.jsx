import React from 'react';
import { FaUserCheck, FaShieldAlt, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

const steps = [
    {
        icon: <FaUserCheck className="text-white text-2xl" />,
        title: 'Verify Identity Easily',
        desc: 'Start with secure phone-based verification to ensure authentic participation.',
        color: 'from-[#7b8dfb] to-[#4b61d1]',
    },
    {
        icon: <FaShieldAlt className="text-white text-2xl" />,
        title: 'Reliable & Secure Spaces',
        desc: 'All listings and interactions are safeguarded through trusted protocols.',
        color: 'from-[#42e695] to-[#3bb2b8]',
    },
    {
        icon: <FaLock className="text-white text-2xl" />,
        title: 'Confidential & Transparent',
        desc: 'We ensure data protection and full transparency throughout the process.',
        color: 'from-[#f093fb] to-[#f5576c]',
    },
];

const stepVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: idx => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: idx * 0.2,
            duration: 0.6,
            ease: 'easeOut',
        },
    }),
};

const OurProcess = () => (
    <section className="py-20 px-4 bg-gradient-to-br from-[#f9fafe] to-[#edf1fd]">
        <div className="max-w-[1320px] mx-auto text-center mb-16">
            <p className="text-[#4960B2] font-semibold tracking-wider uppercase text-sm">Our Process</p>
            <h2 className="text-2xl sm:text-5xl font-bold text-gray-900 mt-2 mb-4">
                Secure, Transparent & Reliable
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                Built around trust—our platform ensures verified users, safe spaces, and confidential deals.
            </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-6">
            {steps.map((step, idx) => (
                <motion.div
                    key={idx}
                    custom={idx}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                    variants={stepVariants}
                    className="relative z-10 flex-1 max-w-xs mx-auto"
                >
                    <div className="group bg-white rounded-3xl shadow-xl px-6 py-10 border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                        <div
                            className={`w-16 h-16 mb-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}
                        >
                            {step.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                    </div>

                    {/* Connector line */}
                    {idx < steps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 right-[-60px] w-28 h-1 bg-gradient-to-r from-[#7b8dfb] via-[#42e695] to-[#f093fb] opacity-40 -translate-y-1/2 z-0"></div>
                    )}
                </motion.div>
            ))}
        </div>
    </section>
);

export default OurProcess;
