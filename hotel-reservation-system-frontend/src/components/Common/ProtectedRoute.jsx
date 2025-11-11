import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Usage (React Router v6):
// <Route path="/admin-dashboard" element={
//   <ProtectedRoute roles={["admin"]}>
//     <AdminDashboard />
//   </ProtectedRoute>
// } />
//
// For multiple roles, pass roles={["admin","reception"]}

export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Basic loading shim: when app first mounts, user may be null until localStorage is read
  const [booting, setBooting] = React.useState(true);
  React.useEffect(() => {
    // Defer one tick to allow AuthContext to hydrate from localStorage
    const id = setTimeout(() => setBooting(false), 0);
    return () => clearTimeout(id);
  }, []);

  if (booting) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>
    );
  }

  // Not authenticated → send to login, preserve intended location
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If roles prop provided, enforce it
  if (Array.isArray(roles) && roles.length > 0) {
    const role = user.role;
    if (!roles.includes(role)) {
      // Redirect to the user's own dashboard when access denied
      const byRole = (r) => (
        r === 'admin' ? '/admin-dashboard'
          : r === 'reception' ? '/reception-dashboard'
          : r === 'housekeeping' ? '/housekeeping-dashboard'
          : r === 'guest' ? '/guest-dashboard'
          : '/'
      );
      return <Navigate to={byRole(role)} replace />;
    }
  }

  // Access granted
  return children;
}
