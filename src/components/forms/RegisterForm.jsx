import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_URL } from '../../config';

export default function RegisterForm() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validate = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const hasUpperCase = /[A-Z]/.test(form.password);
        const hasLowerCase = /[a-z]/.test(form.password);
        const hasNumber = /\d/.test(form.password);
        const isLongEnough = form.password.length >= 6;

        // Name
        if (!form.name.trim()) newErrors.name = 'Name is required.';

        // Email
        if (!form.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!emailRegex.test(form.email)) {
            newErrors.email = 'Enter a valid email.';
        }

        // Password
        if (!form.password) {
            newErrors.password = 'Password is required.';
        } else {
            const passwordErrors = [];
            if (!isLongEnough) passwordErrors.push('at least 6 characters');
            if (!hasUpperCase) passwordErrors.push('an uppercase letter');
            if (!hasLowerCase) passwordErrors.push('a lowercase letter');
            if (!hasNumber) passwordErrors.push('a number');

            if (passwordErrors.length > 0) {
                newErrors.password = `Password must include ${passwordErrors.join(', ')}.`;
            }
        }

        // Confirm Password
        if (!form.confirmPassword) {
            newErrors.confirmPassword = 'Confirm your password.';
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
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
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                name: form.name,
                email: form.email,
                password: form.password
            });

            if (response.status === 201) {
                toast.success("Registration successful!");
                navigate('/verify-otp', { state: { email: form.email } });
                setForm({ name: '', email: '', password: '', confirmPassword: '' });
            } else {
                toast.error("Registration failed.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            const serverMessage = error.response?.data?.message;
            if (serverMessage) {
                setErrors({ email: serverMessage });
            } else {
                toast.error("Server error occurred.");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto bg-white p-6 rounded-md shadow-md">
            <h2 className="text-2xl font-bold text-center text-[#4960B2]">Register for an Account</h2>

            {/* Name */}
            <div>
                <label className="block text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <input
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none text-sm"
                    value={form.name}
                    onChange={handleChange}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none text-sm"
                    value={form.email}
                    onChange={handleChange}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
                <label className="block text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter a strong password"
                        className="mt-1 w-full border border-gray-300 px-3 py-2 pr-10 rounded-md focus:outline-none text-sm"
                        value={form.password}
                        onChange={handleChange}
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer text-sm"
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
                <label className="block text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="mt-1 w-full border border-gray-300 px-3 py-2 pr-10 rounded-md focus:outline-none text-sm"
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />
                    <span
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer text-sm"
                    >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
                type="submit"
                className="w-full bg-[#4960B2] hover:bg-[#374299] text-white py-2 rounded-md transition"
            >
                Register
            </button>

            <div className="text-sm text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-[#4960B2] hover:underline">
                    Login
                </Link>
            </div>
        </form>
    );
}