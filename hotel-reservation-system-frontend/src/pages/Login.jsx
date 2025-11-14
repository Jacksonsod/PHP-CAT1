import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const toast = useToast();

    const handleLogin = (e) => {
        e.preventDefault();

        if (loading) return;
        setLoading(true);

        const form = new URLSearchParams();
        form.append('email', email);
        form.append('password', password);

        axios
            .post('http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/LoginController.php', form)
            .then((res) => {
                if (res.data.success && res.data.user) {
                    const user = res.data.user;
                    const role = user.role;
                    // set auth context
                    login(user);

                    toast.success(res.data.message || 'Login successful');

                    // Redirect based on role
                    if (role === 'admin') navigate('/admin-dashboard');
                    else if (role === 'reception') navigate('/reception-dashboard');
                    else if (role === 'housekeeping') navigate('/housekeeping-dashboard');
                    else if (role === 'guest') navigate('/guest-dashboard');
                    else navigate('/');
                } else {
                    toast.error(res.data.message || 'Login failed. Please try again.');
                }
            })
            .catch((err) => {
                const serverMsg = err?.response?.data?.message;
                console.error('Login error:', err?.response?.status, err?.response?.data || err);
                toast.error(serverMsg || 'Login failed. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <>
            <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-lg">
                <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-1 font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 bg-blue-600 text-white py-2 rounded ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
            <Footer />
        </>
    );
};

export default Login;
