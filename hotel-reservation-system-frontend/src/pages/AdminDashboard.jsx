import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    return (
        <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-center text-red-700">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User & Role Management */}
                <Link to="/manage-users" className="bg-red-100 hover:bg-red-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Manage Users</h2>
                    <p>View, edit, delete users and assign roles.</p>
                </Link>

                {/* Hotel Branches */}
                <Link to="/manage-hotels" className="bg-yellow-100 hover:bg-yellow-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Manage Hotels</h2>
                    <p>Add, edit, deactivate hotel branches.</p>
                </Link>

                {/* Room Inventory */}
                <Link to="/manage-rooms" className="bg-green-100 hover:bg-green-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Manage Rooms</h2>
                    <p>Update room types, prices, status, and amenities.</p>
                </Link>

                {/* Reservations */}
                <Link to="/reservations" className="bg-blue-100 hover:bg-blue-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Reservations</h2>
                    <p>View upcoming bookings and prevent double reservations.</p>
                </Link>

                {/* Payments */}
                <Link to="/payments" className="bg-indigo-100 hover:bg-indigo-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Payments</h2>
                    <p>Simulate payments and track revenue.</p>
                </Link>

                {/* Reviews & Feedback */}
                <Link to="/reviews" className="bg-pink-100 hover:bg-pink-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Guest Feedback</h2>
                    <p>View ratings and comments for service quality reports.</p>
                </Link>

                {/* Audit Logs */}
                <Link to="/audit-logs" className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Audit Logs</h2>
                    <p>Track system activity and user actions.</p>
                </Link>

                {/* Reports & Analytics */}
                <Link to="/reports" className="bg-cyan-100 hover:bg-cyan-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Reports & Analytics</h2>
                    <p>View occupancy, revenue trends, satisfaction ratings.</p>
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="bg-orange-100 hover:bg-orange-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Notifications</h2>
                    <p>Send booking reminders and seasonal offers.</p>
                </Link>

                {/* Fraud Detection */}
                <Link to="/fraud-check" className="bg-red-200 hover:bg-red-300 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Fraud Detection</h2>
                    <p>Identify duplicate accounts and unpaid reservations.</p>
                </Link>

                {/* Export Reports */}
                <Link to="/export-data" className="bg-teal-100 hover:bg-teal-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Export Data</h2>
                    <p>Download reports in PDF or CSV format.</p>
                </Link>

                {/* Loyalty Program */}
                <Link to="/loyalty" className="bg-purple-100 hover:bg-purple-200 p-4 rounded-lg text-center shadow transition">
                    <h2 className="text-xl font-semibold mb-2">Loyalty Program</h2>
                    <p>Manage guest points and redemption rules.</p>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
