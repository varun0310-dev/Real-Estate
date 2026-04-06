import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

export default function VerifyOTP() {
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};

    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
            if (res.status === 200) {
                toast.success("OTP verified successfully!");
                navigate("/login");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-center">Enter the OTP sent to your email</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full border px-3 py-2 rounded"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-[#4960B2] text-white py-2 rounded"
                >
                    Verify OTP
                </button>
            </form>
        </div>
    );
}