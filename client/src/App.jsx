import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Recruitment Pages
import ClubsList from './pages/recruitment/ClubsList';
import ClubDetails from './pages/recruitment/ClubDetails';
import MyApplications from './pages/recruitment/MyApplications';
import ApplicationManagement from './pages/recruitment/ApplicationManagement';
import InterviewCenter from './pages/recruitment/InterviewCenter';

// Event Pages
import EventsList from './pages/events/EventsList';
import EventDetails from './pages/events/EventDetails';
import CreateEventProposal from './pages/events/CreateEventProposal';

// Operations & Attendance
import AttendancePasses from './pages/attendance/AttendancePasses';
import VolunteerHub from './pages/volunteers/VolunteerHub';
import ResourceManager from './pages/resources/ResourceManager';

// Finance & Recognition
import FinanceDashboard from './pages/finance/FinanceDashboard';
import Leaderboard from './pages/gamification/Leaderboard';
import CertificatesPage from './pages/certificates/CertificatesPage';
import VerifyCertificatePublic from './pages/certificates/VerifyCertificatePublic';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        Loading CampusHub...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-certificate/:certificateId?" element={<VerifyCertificatePublic />} />

            {/* Protected System Routes in Dashboard Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />

              {/* Clubs & Recruitment */}
              <Route path="clubs" element={<ClubsList />} />
              <Route path="clubs/:id" element={<ClubDetails />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="recruitment/manage" element={<ApplicationManagement />} />
              <Route path="interviews" element={<InterviewCenter />} />

              {/* Events & Proposals */}
              <Route path="events" element={<EventsList />} />
              <Route path="events/create" element={<CreateEventProposal />} />
              <Route path="events/:id" element={<EventDetails />} />

              {/* Attendance & Operations */}
              <Route path="attendance" element={<AttendancePasses />} />
              <Route path="volunteers" element={<VolunteerHub />} />
              <Route path="resources" element={<ResourceManager />} />

              {/* Finance & Recognition */}
              <Route path="finance" element={<FinanceDashboard />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="certificates" element={<CertificatesPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
