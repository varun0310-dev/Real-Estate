import React from 'react';
import { motion } from 'framer-motion';
import {
    FaUserShield,
    FaFingerprint,
    FaCheckCircle,
    FaLock,
    FaFileSignature,
    FaGlobe,
} from 'react-icons/fa';

const ACCENT = '#4960B2';

const features = [
    {
        icon: <FaUserShield />,
        title: 'Data Integrity Guaranteed',
        desc: 'We protect your personal and transactional data with industry-grade encryption and policies.',
    },
    {
        icon: <FaFingerprint />,
        title: 'Authentic User Access',
        desc: 'Only verified users gain access. Our platform verifies every participant for secure collaboration.',
    },
    {
        icon: <FaCheckCircle />,
        title: 'Trust-Centric Features',
        desc: 'Every listing is screened for authenticity. Our backend ensures only genuine properties and users are visible.',
    },
    {
        icon: <FaLock />,
        title: 'Zero Tolerance for Fraud',
        desc: 'We enforce strict verification and no hidden charges. You’re protected from both financial and data fraud.',
    },
    {
        icon: <FaFileSignature />,
        title: 'Legal Compliance & Clarity',
        desc: 'We assist throughout your transaction, ensuring clear agreements, documents, and compliance.',
    },
    {
        icon: <FaGlobe />,
        title: 'Easy-to-Use Digital Platform',
        desc: 'Our platform is AI-powered, map-integrated, and designed for anyone to navigate with confidence and ease.',
    },
];

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            type: 'spring',
            stiffness: 300,
        },
    }),
};

const WhatWeDo = () => (
    <section className="py-20 px-6 bg-gradient-to-br from-[#f9fafe] to-[#edf1fd]">
        <div className="max-w-4xl mx-auto mb-12 text-center">
            <p className="text-[#4960B2] uppercase text-sm font-semibold tracking-wider">
                What We Provide
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-2 mb-4">
                Reliable Authentication Spaces for Trusted Real Estate
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
                Our platform is built to ensure authenticity, safety, and ease at every step of your property journey.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((item, i) => (
                <motion.div
                    key={i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03, backgroundColor: '#f1f4fb' }}
                    className="relative flex items-start gap-4 p-6 rounded-xl bg-blue-50 border border-[#e5eaf3] transition-all cursor-pointer group"
                >
                    {/* Accent Bar */}
                    <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: '100%' }}
                        transition={{ duration: 0.4, delay: i * 0.11 }}
                        className="absolute left-0 top-0 w-1 rounded-r"
                        style={{ backgroundColor: ACCENT }}
                    />
                    {/* Icon */}
                    <span
                        className="flex-shrink-0 mt-1 transition-colors"
                        style={{ color: ACCENT, fontSize: 28 }}
                        aria-hidden
                    >
                        {item.icon}
                    </span>
                    {/* Content */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-[#4960B2] transition-colors">
                            {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    </section>
);

export default WhatWeDo;
