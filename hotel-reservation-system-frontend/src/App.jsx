import React from 'react';
import './index.css';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Header from './components/Header';
import ReservationSearch from './pages/ReservationSearch';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import Hotels from './pages/Admin/Hotels';
import Rooms from './pages/Admin/Rooms';
import Reservations from './pages/Admin/Reservations';
import Users from './pages/Admin/Users';
import Reports from './pages/Admin/Reports';
import Analytics from './pages/Admin/Analytics';
import ReceptionDashboard from './pages/Dashboard/ReceptionDashboard';
import CheckIns from './pages/Reception/CheckIns';
import CheckOuts from './pages/Reception/CheckOuts';
import RoomStatus from './pages/Reception/RoomStatus';
import HousekeepingDashboard from './pages/Dashboard/HousekeepingDashboard';
import GuestDashboard from './pages/Dashboard/GuestDashboard';
import ProtectedRoute from './components/Common/ProtectedRoute';

export default function App() {
    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/search" element={<ReservationSearch />} />
                <Route path="/admin-dashboard" element={
                    <ProtectedRoute roles={["admin"]}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/hotels" element={
                    <ProtectedRoute roles={["admin"]}>
                        <Hotels />
                    </ProtectedRoute>
                } />
                <Route path="/rooms" element={
                    <ProtectedRoute roles={["admin"]}>
                        <Rooms />
                    </ProtectedRoute>
                } />
                <Route path="/reservations" element={
                    <ProtectedRoute roles={["admin"]}>
                        <Reservations />
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute roles={["admin"]}>
                        <Users />
                    </ProtectedRoute>
                } />
                <Route path="/reports" element={
                    <ProtectedRoute roles={["admin"]}>
                        <Reports />
                    </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute roles={["admin"]}>
                        <Analytics />
                    </ProtectedRoute>
                } />
                <Route path="/reception-dashboard" element={
                    <ProtectedRoute roles={["reception"]}>
                        <ReceptionDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/checkins" element={
                    <ProtectedRoute roles={["reception"]}>
                        <CheckIns />
                    </ProtectedRoute>
                } />
                <Route path="/checkouts" element={
                    <ProtectedRoute roles={["reception"]}>
                        <CheckOuts />
                    </ProtectedRoute>
                } />
                <Route path="/room-status" element={
                    <ProtectedRoute roles={["reception"]}>
                        <RoomStatus />
                    </ProtectedRoute>
                } />
                <Route path="/housekeeping-dashboard" element={
                    <ProtectedRoute roles={["housekeeping"]}>
                        <HousekeepingDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/guest-dashboard" element={
                    <ProtectedRoute roles={["guest"]}>
                        <GuestDashboard />
                    </ProtectedRoute>
                } />
                {/* Add About and Contact pages later */}
            </Routes>
        </>
    );
}
