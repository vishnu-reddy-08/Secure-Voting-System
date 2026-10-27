import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import KioskLayout from './layouts/KioskLayout';

// Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VotersList from './pages/VotersList';
import VoterCreate from './pages/VoterCreate';
import ElectionsList from './pages/ElectionsList';
import CandidatesList from './pages/CandidatesList';
import AuditLogs from './pages/AuditLogs';

// Voter Kiosk Pages
import VoterLanding from './pages/VoterLanding';
import VoterVerify from './pages/VoterVerify';
import Ballot from './pages/Ballot';
import VoteSuccess from './pages/VoteSuccess';
import AlreadyVoted from './pages/AlreadyVoted';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Default redirect to Voter Kiosk */}
            <Route path="/" element={<Navigate to="/vote" replace />} />

            {/* Admin Login */}
            <Route path="/login" element={<Login />} />

            {/* Admin Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="voters" element={<VotersList />} />
              <Route path="voters/create" element={<VoterCreate />} />
              <Route path="elections" element={<ElectionsList />} />
              <Route path="candidates" element={<CandidatesList />} />
              <Route path="audit-logs" element={<AuditLogs />} />
            </Route>

            {/* Voter Kiosk Routes */}
            <Route path="/vote" element={<KioskLayout />}>
              <Route index element={<VoterLanding />} />
              <Route path="verify" element={<VoterVerify />} />
              <Route path="ballot" element={<Ballot />} />
              <Route path="success" element={<VoteSuccess />} />
              <Route path="already-voted" element={<AlreadyVoted />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/vote" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;

