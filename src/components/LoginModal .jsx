import React, { useEffect, useState, useRef, useCallback } from 'react';
import { IoMdClose } from 'react-icons/io';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('signin');

    const [loginForm, setLoginForm] = useState({
        email: '',
        password: '',
    });
    const [loginErrors, setLoginErrors] = useState({});
    const [loginServerError, setLoginServerError] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');

    const [googleLoading, setGoogleLoading] = useState(false);
    const googleInitialized = useRef(false);

    useEffect(() => {
        document.body.classList.add('overflow-hidden');
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, []);

    // Google credential callback
    const handleGoogleCredentialResponse = useCallback(async (response) => {
        setGoogleLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/google-login`, {
                credential: response.credential,
            });

            if (res.status === 200) {
                localStorage.setItem('token', res.data.token);
                toast.success('Signed in with Google!');
                onClose();
                window.location.reload();
            }
        } catch (error) {
            console.error('Google login error:', error);
            const msg = error.response?.data?.message || 'Google sign-in failed. Please try again.';
            toast.error(msg);
        } finally {
            setGoogleLoading(false);
        }
    }, [onClose]);

    // Load Google Identity Services script
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.warn('VITE_GOOGLE_CLIENT_ID is not set');
            return;
        }

        if (googleInitialized.current) return;

        const loadGoogleScript = () => {
            // Check if already loaded
            if (window.google?.accounts?.id) {
                initializeGoogle();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogle;
            document.head.appendChild(script);
        };

        const initializeGoogle = () => {
            if (googleInitialized.current) return;
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });
            googleInitialized.current = true;
        };

        loadGoogleScript();
    }, [handleGoogleCredentialResponse]);

    const handleGoogleSignIn = () => {
        if (!window.google?.accounts?.id) {
            toast.error('Google Sign-In is not ready yet. Please try again.');
            return;
        }
        // Trigger the Google One Tap / Sign-In popup
        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback: use renderButton approach or popup mode
                // Try the popup sign-in via google.accounts.oauth2 or just render
                const btnContainer = document.getElementById('google-signin-btn-hidden');
                if (btnContainer) {
                    btnContainer.innerHTML = '';
                    window.google.accounts.id.renderButton(btnContainer, {
                        type: 'standard',
                        size: 'large',
                        width: 400,
                    });
                    // Auto-click the rendered button
                    setTimeout(() => {
                        const gBtn = btnContainer.querySelector('[role="button"]') || btnContainer.querySelector('div[role="button"]') || btnContainer.querySelector('iframe');
                        if (gBtn) gBtn.click();
                    }, 100);
                }
            }
        });
    };

    const handleLoginChange = (e) => {
        setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
        setLoginErrors({ ...loginErrors, [e.target.name]: '' });
        setLoginServerError('');
    };

    const validateLogin = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!loginForm.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!emailRegex.test(loginForm.email)) {
            newErrors.email = 'Enter a valid email.';
        }

        if (!loginForm.password.trim()) {
            newErrors.password = 'Password is required.';
        }

        return newErrors;
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateLogin();

        if (Object.keys(validationErrors).length > 0) {
            setLoginErrors(validationErrors);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email: loginForm.email,
                password: loginForm.password,
            });

            if (response.status === 200) {
                localStorage.setItem('token', response.data.token);
                toast.success('Login successful!');
                onClose();
                window.location.reload();
            } else {
                setLoginServerError('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.response?.data?.message) {
                setLoginServerError(error.response.data.message);
            } else {
                setLoginServerError('Server error. Please try again later.');
            }
        }
    };

    const handleRegisterChange = (e) => {
        setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const hasUpperCase = /[A-Z]/.test(registerForm.password);
        const hasLowerCase = /[a-z]/.test(registerForm.password);
        const hasNumber = /\d/.test(registerForm.password);
        const isLongEnough = registerForm.password.length >= 6;

        if (!registerForm.name.trim()) newErrors.name = 'Name is required.';
        if (!registerForm.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!emailRegex.test(registerForm.email)) {
            newErrors.email = 'Enter a valid email.';
        }
        if (!registerForm.password) {
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
        if (!registerForm.confirmPassword) {
            newErrors.confirmPassword = 'Confirm your password.';
        } else if (registerForm.password !== registerForm.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, {
                name: registerForm.name,
                email: registerForm.email,
                password: registerForm.password,
            });

            if (response.status === 201) {
                toast.success('Registration successful!');
                setActiveTab('signin');
                setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
            } else {
                toast.error('Registration failed.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            const serverMessage = error.response?.data?.message;
            if (serverMessage) {
                setErrors({ email: serverMessage });
            } else {
                toast.error('Server error occurred.');
            }
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!forgotEmail.trim()) {
            setForgotError("Email is required.");
        } else if (!emailRegex.test(forgotEmail)) {
            setForgotError("Please enter a valid email address.");
        } else {
            try {
                const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email: forgotEmail });
                if (res.status === 200) {
                    setForgotSuccess("If this email is registered, a reset link will be sent.");
                }
            } catch (err) {
                const msg = err.response?.data?.message || "Something went wrong.";
                setForgotError(msg);
            }
        }
    };

    // Google sign-in button component
    const GoogleSignInButton = () => (
        <div className="mt-1 mb-1">
            <div className="relative flex items-center justify-center my-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="mx-4 text-sm text-gray-400 font-medium whitespace-nowrap">or continue with</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-[#4960B2] bg-white hover:bg-[#f8f9ff] text-gray-700 font-semibold py-2.5 px-4 rounded-lg cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#4960B2] rounded-full animate-spin"></div>
                ) : (
                    <FcGoogle className="text-xl group-hover:scale-110 transition-transform" />
                )}
                <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>
            {/* Hidden container for fallback Google button rendering */}
            <div id="google-signin-btn-hidden" className="hidden"></div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-[2px]">
            <div className="bg-white w-full max-w-[500px] max-h-[95vh] rounded-lg overflow-y-auto p-6 relative">
                <button className="absolute top-4 right-4 cursor-pointer " onClick={onClose}>
                    <IoMdClose size={24} className='text-[#4960B2]' />
                </button>

                <h2 className="text-xl font-semibold mb-4">Welcome to Reliable Spaces</h2>

                {activeTab !== 'forgot' && (
                    <div className="flex space-x-8 border-b mb-4">
                        <button
                            className={`pb-2 font-semibold cursor-pointer ${activeTab === 'signin' ? 'border-b-2 border-black' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('signin')}
                        >
                            Sign In
                        </button>
                        <button
                            className={`pb-2 font-semibold cursor-pointer ${activeTab === 'register' ? 'border-b-2 border-black' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('register')}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {activeTab === 'signin' && (
                    <form className="space-y-4" onSubmit={handleLoginSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter Email"
                                className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none"
                                value={loginForm.email}
                                onChange={handleLoginChange}
                            />
                            {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <input
                                    type={showLoginPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter Password"
                                    className="w-full border  border-gray-300 px-4 py-2 pr-10 rounded focus:outline-none"
                                    value={loginForm.password}
                                    onChange={handleLoginChange}
                                />
                                <span
                                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                >
                                    {showLoginPassword ? <FiEyeOff /> : <FiEye />}
                                </span>
                            </div>
                            {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password}</p>}
                            {loginServerError && <p className="text-red-500 text-xs mt-1">{loginServerError}</p>}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className='cursor-pointer' />
                                <span>Remember me</span>
                            </label>
                            <button type="button" className="text-[#4960B2] cursor-pointer " onClick={() => setActiveTab('forgot')}>
                                Forgot your password?
                            </button>
                        </div>

                        <button type="submit" className="w-full cursor-pointer bg-[#4960B2] text-white py-2 rounded transition">
                            Sign in
                        </button>

                        <GoogleSignInButton />

                        <div className="text-sm text-center pt-2">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                className="text-[#4960B2] cursor-pointer hover:underline"
                                onClick={() => setActiveTab('register')}
                            >
                                Sign up
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
                                value={registerForm.name}
                                onChange={handleRegisterChange}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm"
                                value={registerForm.email}
                                onChange={handleRegisterChange}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    className="w-full border border-gray-300 px-3 py-2 pr-10 rounded-md text-sm"
                                    value={registerForm.password}
                                    onChange={handleRegisterChange}
                                />
                                <span
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </span>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Confirm Password</label>
                            <div className="relative">
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm password"
                                    className="w-full border border-gray-300 px-3 py-2 pr-10 rounded-md text-sm"
                                    value={registerForm.confirmPassword}
                                    onChange={handleRegisterChange}
                                />
                                <span
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </span>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <button type="submit" className="w-full cursor-pointer bg-[#4960B2] text-white py-2 rounded transition">
                            Sign up
                        </button>

                        <GoogleSignInButton />

                        <div className="text-sm text-center pt-2">
                            Already have an account?{' '}
                            <button
                                type="button"
                                className="text-[#4960B2] cursor-pointer hover:underline"
                                onClick={() => setActiveTab('signin')}
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'forgot' && (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full border border-gray-300 focus:outline-none px-3 py-2 rounded-md text-sm"
                                value={forgotEmail}
                                onChange={e => setForgotEmail(e.target.value)}
                            />
                            {forgotError && <p className="text-red-500 text-xs mt-1">{forgotError}</p>}
                            {forgotSuccess && <p className="text-green-600 text-xs mt-1">{forgotSuccess}</p>}
                        </div>
                        <button type="submit" className="w-full cursor-pointer bg-[#4960B2] text-white py-2 rounded transition">
                            Send Reset Link
                        </button>
                        <div className="text-sm text-center pt-2">
                            <button
                                type="button"
                                className="text-[#4960B2] hover:underline cursor-pointer "
                                onClick={() => setActiveTab('signin')}
                            >
                                Back to Sign in
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginModal;
