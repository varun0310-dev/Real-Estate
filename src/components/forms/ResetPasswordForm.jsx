import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';

export default function ResetPasswordForm() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await axios.post(`${API_URL}/api/auth/reset-password/${token}`, {
                newPassword
            });
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto p-6 border rounded bg-white mt-10">
            <h2 className="text-2xl font-bold text-center">Reset Password</h2>

            {message && <p className="text-green-600 text-center">{message}</p>}
            {error && <p className="text-red-600 text-center">{error}</p>}

            <div>
                <label>New Password</label>
                <input
                    type="password"
                    className="w-full border px-3 py-2 rounded"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
            </div>

            <div>
                <label>Confirm Password</label>
                <input
                    type="password"
                    className="w-full border px-3 py-2 rounded"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>

            <button type="submit" className="w-full bg-yellow-500 text-white py-2 rounded">
                Reset Password
            </button>
        </form>
    );
}