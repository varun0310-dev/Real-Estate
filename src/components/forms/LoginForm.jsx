import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { API_URL } from '../../config';

export default function LoginForm() {
    const [form, setForm] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setServerError('');
    };

    const validate = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!form.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!emailRegex.test(form.email)) {
            newErrors.email = 'Enter a valid email.';
        }

        if (!form.password.trim()) {
            newErrors.password = 'Password is required.';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email: form.email,
                password: form.password,
            });

            if (response.status === 200) {
                localStorage.setItem("token", response.data.token);
                navigate('/dashboard/profile');
            } else {
                setServerError("Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Login error:", error);
            if (error.response?.data?.message) {
                setServerError(error.response.data.message);
            } else {
                setServerError("Server error. Please try again later.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Login</h2>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium">Email <span className="text-red-500">*</span> </label>
                <input
                    type="email"
                    name="email"
                    placeholder="Enter your Email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none text-sm placeholder-gray-400"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
                <label className="block text-sm font-medium">Password <span className="text-red-500">*</span> </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        className="mt-1 w-full border  border-gray-300 px-3 py-2 rounded-md focus:outline-none text-sm placeholder-gray-400"
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-600"
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Server Error */}
            {serverError && <p className="text-red-600 text-sm text-center">{serverError}</p>}

            {/* Submit */}
            <button type="submit" className="w-full bg-[#4960B2] text-white py-2 cursor-pointer rounded-md">
                Login
            </button>

            {/* Links */}
            <div className="text-sm text-center">
                <Link to="/forgot-password" className="text-[#4960B2] hover:underline">Forgot Password?</Link>
            </div>
            <div className="text-sm text-center">
                Don’t have an account? <Link to="/register" className="text-[#4960B2] hover:underline">Register</Link>
            </div>
        </form>
    );
}
