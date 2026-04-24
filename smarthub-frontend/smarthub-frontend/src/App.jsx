import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OAuth2CallbackPage from './pages/OAuth2CallbackPage';
import AdminDashboard from './pages/AdminDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import UserDashboard from './pages/UserDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Facility pages
import FacilitiesPage from './pages/FacilitiesPage';
import FacilityDetailPage from './pages/FacilityDetailPage';
import FacilityFormPage from './pages/FacilityFormPage';

// Booking pages
import BookingCreatePage from './pages/BookingCreatePage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';

// Incident pages
import IncidentsPage from './pages/IncidentsPage';
import IncidentCreatePage from './pages/IncidentCreatePage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import IncidentEditPage from './pages/IncidentEditPage';

/**
 * Root component handling all application routing.
 *
 * Public routes: /login, /signup, /oauth2/callback
 * Protected routes: dashboards, facilities, bookings
 * Default: redirects to login or appropriate dashboard
 */
function AppRoutes() {
    const { isAuthenticated, user, loading, getDashboardPath } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ice">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted text-sm font-medium">Loading SmartHub...</p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

            {/* Protected Dashboard Routes */}
            <Route
                path="/dashboard/admin"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/technician"
                element={
                    <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                        <TechnicianDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/user"
                element={
                    <ProtectedRoute allowedRoles={['USER']}>
                        <UserDashboard />
                    </ProtectedRoute>
                }
            />

            {/* ==================== Facility Routes ==================== */}

            {/* Browse all facilities (any authenticated user) */}
            <Route
                path="/facilities"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <FacilitiesPage />
                    </ProtectedRoute>
                }
            />

            {/* Create new facility (ADMIN only) */}
            <Route
                path="/facilities/new"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <FacilityFormPage />
                    </ProtectedRoute>
                }
            />

            {/* View facility detail (any authenticated user) */}
            <Route
                path="/facilities/:id"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <FacilityDetailPage />
                    </ProtectedRoute>
                }
            />

            {/* Edit facility (ADMIN only) */}
            <Route
                path="/facilities/:id/edit"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <FacilityFormPage />
                    </ProtectedRoute>
                }
            />

            {/* ==================== Booking Routes ==================== */}

            {/* Create new booking (any authenticated user) */}
            <Route
                path="/bookings/new"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <BookingCreatePage />
                    </ProtectedRoute>
                }
            />

            {/* User's own bookings */}
            <Route
                path="/bookings/my"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <MyBookingsPage />
                    </ProtectedRoute>
                }
            />

            {/* Admin booking management (all bookings) */}
            <Route
                path="/bookings"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminBookingsPage />
                    </ProtectedRoute>
                }
            />

            {/* Booking detail (owner or admin) */}
            <Route
                path="/bookings/:id"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <BookingDetailPage />
                    </ProtectedRoute>
                }
            />

            {/* ==================== Incident Routes ==================== */}

            <Route
                path="/incidents"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <IncidentsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/incidents/new"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <IncidentCreatePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/incidents/:id"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
                        <IncidentDetailPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/incidents/:id/edit"
                element={
                    <ProtectedRoute allowedRoles={['USER']}>
                        <IncidentEditPage />
                    </ProtectedRoute>
                }
            />

            {/* Default Route: redirect based on auth state */}
            <Route
                path="*"
                element={
                    isAuthenticated && user ? (
                        <Navigate to={getDashboardPath(user.role)} replace />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}

export default App;
