import React from 'react';
import { Link } from 'react-router-dom';

const GuestDashboard = () => {
    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Welcome, Guest!</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    to="/search"
                    className="bg-blue-100 hover:bg-blue-200 p-4 rounded-lg text-center shadow transition"
                >
                    <h2 className="text-xl font-semibold mb-2">Search Rooms</h2>
                    <p>Find available rooms and make reservations.</p>
                </Link>

                <Link
                    to="/my-reservations"
                    className="bg-green-100 hover:bg-green-200 p-4 rounded-lg text-center shadow transition"
                >
                    <h2 className="text-xl font-semibold mb-2">My Reservations</h2>
                    <p>View and manage your bookings.</p>
                </Link>

                <Link
                    to="/profile"
                    className="bg-yellow-100 hover:bg-yellow-200 p-4 rounded-lg text-center shadow transition"
                >
                    <h2 className="text-xl font-semibold mb-2">Profile</h2>
                    <p>Update your personal information.</p>
                </Link>
            </div>
        </div>
    );
};

export default GuestDashboard;
