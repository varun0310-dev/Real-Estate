import React from 'react';
import { FaFingerprint, FaShieldAlt, FaUserCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const features = [
    {
        icon: <FaFingerprint className="text-white text-2xl" />,
        title: 'Instant & Secure Sign-Ins',
        desc: 'Authenticate users in milliseconds with full encryption — using biometrics, OTPs, or social logins.',
        color: 'from-[#7b8dfb] to-[#4b61d1]',
        badge: '⚡ Instant',
    },
    {
        icon: <FaShieldAlt className="text-white text-2xl" />,
        title: 'Zero Trust Access Control',
        desc: 'Protect digital spaces with granular permissions, MFA, and role-based access for peace of mind.',
        color: 'from-[#42e695] to-[#3bb2b8]',
        badge: '🔒 Trusted',
    },
    {
        icon: <FaUserCheck className="text-white text-2xl" />,
        title: 'Seamless User Lifecycle',
        desc: 'Onboard, verify, and manage users with a unified dashboard — built for scale and reliability.',
        color: 'from-[#f093fb] to-[#f5576c]',
        badge: '🌐 Global',
    },
];

const cardVariants = {
    offscreen: { opacity: 0, y: 40 },
    onscreen: (idx) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: idx * 0.18 }
    }),
};

const WhoWeAre = () => {
    return (
        <section className="relative px-6 md:px-16 py-24 bg-gradient-to-br from-[#f9fafe] to-[#edf1fd] text-gray-800 overflow-hidden">
            {/* Custom SVG Background Accents */}
            <svg className="absolute -top-32 -left-32 w-80 h-80 z-0" viewBox="0 0 320 320" fill="none">
                <circle cx="160" cy="160" r="160" fill="#4960B2" fillOpacity="0.08" />
            </svg>
            <svg className="absolute -bottom-20 -right-10 w-96 h-96 z-0" viewBox="0 0 384 384" fill="none">
                <circle cx="192" cy="192" r="192" fill="#4960B2" fillOpacity="0.08" />
            </svg>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-4xl mx-auto">
                    <p className="text-xs tracking-widest text-[#4960B2] uppercase font-semibold mb-3">
                        Why Reliable Authentication?
                    </p>
                    <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4 ">
                        Security That Just Works — Fast, Trusted & Seamless
                    </h2>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                        We build authentication experiences that are secure by default, simple to integrate, and trusted by developers and users alike. Designed for scalable apps and sensitive spaces.
                    </p>
                    {/* Action Links */}
                    <div className="mt-6 flex justify-center flex-wrap gap-6">
                        <a
                            href="#"
                            className="text-[#4960B2] relative font-medium group"
                        >
                            <span>Explore Features</span>
                            <span className="block h-[2px] w-0 bg-[#4960B2] group-hover:w-full transition-all duration-300"></span>
                        </a>
                        <a
                            href="#"
                            className="text-[#4960B2] relative font-medium group"
                        >
                            <span>Start Integration</span>
                            <span className="block h-[2px] w-0 bg-[#4960B2] group-hover:w-full transition-all duration-300"></span>
                        </a>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="mt-20 grid md:grid-cols-3 gap-10">
                    {features.map((item, idx) => (
                        <motion.div
                            key={idx}
                            className="group bg-white/30 backdrop-blur-md border border-white/30 shadow-xl rounded-3xl p-8 transition-transform duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
                            initial="offscreen"
                            whileInView="onscreen"
                            viewport={{ once: true, amount: 0.4 }}
                            custom={idx}
                            variants={cardVariants}
                        >
                            {/* Icon Bubble */}
                            <div
                                className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg mb-6 group-hover:rotate-6 transition-transform duration-300`}
                            >
                                {item.icon}
                            </div>
                            {/* Card Content */}
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 font-sans">{item.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                            {/* Unique Badge */}
                            <span className="absolute top-4 right-4 bg-[#4960B2] text-white text-xs px-3 py-1 rounded-full shadow font-semibold tracking-wide flex items-center gap-1">
                                {item.badge}
                            </span>
                            {/* Accent Circle */}
                            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#e0e7ff] opacity-10 rounded-full blur-3xl z-0"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhoWeAre;
