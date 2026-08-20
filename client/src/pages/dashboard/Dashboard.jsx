import React from 'react';
import { useAuth } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import LeaderDashboard from './LeaderDashboard';
import InterviewerDashboard from './InterviewerDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (user?.role === 'CLUB_LEADER') {
    return <LeaderDashboard />;
  }

  if (user?.role === 'INTERVIEWER') {
    return <InterviewerDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;
