import React, { useState } from 'react';
import axios from 'axios';
import Footer from '../components/Footer';
import {useNavigate} from "react-router-dom";
import { useToast } from '../context/ToastContext';

const Signup = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const Navigate = useNavigate();
    const toast = useToast();
    

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        const name = `${firstName.trim()} ${lastName.trim()}`.trim();
        const form = new URLSearchParams();
        form.append('first_name', firstName.trim());
        form.append('last_name', lastName.trim());
        form.append('name', name);
        form.append('email', email);
        form.append('password', password);
        form.append('role', role);

        axios.post(
            'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/UserController.php',
            form
        )
            .then((res) => {
                if (res.data.success) {
                    // clear form on success
                    setFirstName('');
                    setLastName('');
                    setEmail('');
                    setPassword('');
                    setRole('');
                    setMessage('');
                    toast.success(res.data.message || 'Account created successfully. You can now log in.');
                    Navigate('/login');
                }
                else{
                    // set error message
                    setMessage(res.data.message);
                    toast.error(res.data.message || 'Signup failed. Please try again.');
                }

            })
            .catch((err) => {
                const serverMsg = err?.response?.data?.message;
                console.error('Signup error:', err?.response?.status, err?.response?.data || err);
                setMessage(serverMsg || 'Something went wrong. Please try again.');
                toast.error(serverMsg || 'Signup failed. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });
    };


    return (
        <>
            <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-lg rounded-lg">
                <h2 className="text-2xl font-bold text-center mb-6">Signup</h2>
                {message && (
                    <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>

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

                    <div>
                        <label className="block mb-1 font-medium">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded"
                        >
                            <option value="">Select role</option>
                            <option value="guest">Guest</option>
                            <option value="reception">Reception</option>
                            <option value="housekeeping">Housekeeping</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-4 bg-blue-600 text-white py-2 rounded ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                    >
                        {loading ? 'Signing up...' : 'Signup'}
                    </button>
                </form>
            </div>
            <Footer />
        </>
    );
};

export default Signup;
