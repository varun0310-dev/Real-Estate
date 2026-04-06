import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiBell, FiChevronDown, FiUser, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";  // <-- Import useNavigate
import axios from "axios";
import Dummy from "@assets/loginlogo/dummy.png"; // ⬅️ adjust path if needed
import { API_URL } from '../../config';

const Navbar = ({ title, onProfileClick }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profile, setProfile] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();  // <-- Initialize navigate

    // Fetch profile on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios
                .get(`${API_URL}/api/profile/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                .then((res) => {
                    setProfile(res.data.user);
                    console.log("✅ Profile loaded:", res.data.user);
                })
                .catch((err) => {
                    console.error("❌ Failed to load profile", err);
                });
        }
    }, []);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");  // <-- Redirect to home page
    };

    const getProfileImage = () => {
        if (profile?.profileImage) {
            const url = profile.profileImage.startsWith("http")
                ? profile.profileImage
                : `${API_URL}${profile.profileImage}`;
            return `${url}?t=${Date.now()}`; // Avoid cache
        }
        return Dummy;
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white relative">
            {/* Title */}
            <div className="flex items-center gap-8">
                <h1 className="text-xl font-semibold text-[#0D1C44]">{title}</h1>
            </div>

            {/* Search */}
            {/* <div className="absolute left-1/2 transform -translate-x-1/2">
                <div className="relative">
                    <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-[#4960B2] text-lg" />
                    <input
                        type="text"
                        placeholder="Search here..."
                        className="pl-10 pr-4 py-2 rounded-full bg-[#f7f8fa] text-sm text-gray-700 w-72 focus:outline-none"
                    />
                </div>
            </div> */}

            {/* Right */}
            <div className="flex items-center gap-6" ref={dropdownRef}>
                {/* Notifications */}
                <div className="relative bg-[#fff7e8] p-2 rounded-full cursor-pointer">
                    <FiBell className="text-[#f6a72d] text-xl" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>

                {/* Profile */}
                <div className="relative">
                    <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                    >
                        <img
                            src={getProfileImage()}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => (e.target.src = Dummy)}
                        />
                        <div className="text-sm leading-tight">
                            <div className="text-[#0D1C44] font-medium">
                                {profile?.name || "User"}
                            </div>
                            <div className="text-gray-400 text-xs">
                                {profile?.userType?.toUpperCase() || "Role"}
                            </div>
                        </div>
                        <FiChevronDown className="text-sm text-gray-500" />
                    </div>

                    {/* Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-50">
                            <div
                                className="p-3 flex items-center gap-3 hover:bg-[#4960B2] hover:text-white cursor-pointer rounded-t-xl"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    onProfileClick();
                                }}
                            >
                                <FiUser />
                                <span className="text-sm font-medium">My Profile</span>
                            </div>
                            <div
                                className="p-3 flex items-center gap-3 hover:bg-[#4960B2] hover:text-white cursor-pointer rounded-b-xl"
                                onClick={handleLogout}
                            >
                                <FiLogOut />
                                <span className="text-sm font-medium">Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;
