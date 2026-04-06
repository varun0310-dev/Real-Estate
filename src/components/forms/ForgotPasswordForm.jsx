import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError("Email is required.");
        } else if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
        } else {
            try {
                const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });

                if (res.status === 200) {
                    setSuccess("If this email is registered, a reset link will be sent.");
                }
            } catch (err) {
                const msg = err.response?.data?.message || "Something went wrong.";
                setError(msg);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold text-center">Forgot Password</h2>

            <div>
                <label className="block text-sm font-medium">Email <span className="text-red-500">*</span> </label>
                <input
                    type="email"
                    placeholder='Enter your email'
                    className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none text-sm placeholder-gray-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                {success && <p className="text-green-600 text-sm mt-1">{success}</p>}
            </div>

            <button
                type="submit"
                className="w-full bg-[#4960B2] text-white py-2 rounded-md cursor-pointer transition"
            >
                Send Reset Link
            </button>

            <div className="text-sm text-center">
                <Link to="/login" className="text-[#4960B2] hover:underline">Back to Login</Link>
            </div>
        </form>
    );
}