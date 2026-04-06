import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import Logo from '@assets/logo.svg';
import { Link } from 'react-router-dom';


const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container max-w-[1440px] mx-auto px-6 py-10 flex flex-col justify-between">
                {/* Top Section - 4 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
                    {/* Col 1: Logo + Text + Social */}
                    <div>
                        <Link to="/">
                            <img src={Logo} alt="Logo" className="w-[120px]" />
                        </Link>
                        <p className="text-sm text-gray-400 mb-4">
                            Discover your dream property with ease and confidence.
                        </p>
                        <div className="flex space-x-3">
                            {[FaFacebookF, FaTwitter, FaInstagram].map((Icon, index) => (
                                <button
                                    key={index}
                                    className="bg-white text-gray-900 rounded-full p-2 hover:bg-gray-200 transition"
                                >
                                    <Icon size={16} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Col 2: Quick Links */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Quick Links</h3>
                        <div className="h-1 w-1/2 bg-gradient-to-r from-[#444096] to-white mb-4" />
                        <ul className="space-y-2 text-sm list-disc list-inside text-gray-300">
                            <li><a href="#" className="hover:underline">Home</a></li>
                            <li><a href="#" className="hover:underline">Properties</a></li>
                            <li><a href="#" className="hover:underline">Blog</a></li>
                        </ul>
                    </div>

                    {/* Col 3: Explore */}
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Explore</h3>
                        <div className="h-1 w-1/2 bg-gradient-to-r from-[#444096] to-white mb-4" />
                        <ul className="space-y-2 text-sm list-disc list-inside text-gray-300">
                            <li><a href="#" className="hover:underline">About Us</a></li>
                            <li><a href="#" className="hover:underline">Contact Us</a></li>
                            <li><a href="#" className="hover:underline">Terms and Conditions</a></li>
                            <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Col 4: Contact + Newsletter */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
                        <form className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="px-4 py-2 rounded bg-gray-800 text-white placeholder-gray-400"
                            />
                            <button
                                type="submit"
                                className="w-1/2 bg-blue-600 hover:bg-blue-700 py-2 rounded font-medium"
                            >
                                Subscribe Now
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;