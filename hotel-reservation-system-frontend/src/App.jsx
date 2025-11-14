import React from 'react';
import './index.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

export default function App() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        if (!user) return;

        const INACTIVITY_LIMIT_MS = 3 * 60 * 1000; // 3 minutes
        let timeoutId;

        const handleLogout = () => {
            logout();
            toast.info('You were logged out due to inactivity');
            navigate('/login');
        };

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT_MS);
        };

        const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
        events.forEach((ev) => window.addEventListener(ev, resetTimer));
        resetTimer();

        return () => {
            events.forEach((ev) => window.removeEventListener(ev, resetTimer));
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [user, logout, toast, navigate, location.pathname]);

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
