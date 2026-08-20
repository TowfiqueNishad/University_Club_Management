import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campushub_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('campushub_user', JSON.stringify(res.data.data));
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: jwtToken, ...userData } = res.data.data;
      localStorage.setItem('campushub_token', jwtToken);
      localStorage.setItem('campushub_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { token: jwtToken, ...userData } = res.data.data;
      localStorage.setItem('campushub_token', jwtToken);
      localStorage.setItem('campushub_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
  };

  const logout = () => {
    localStorage.removeItem('campushub_token');
    localStorage.removeItem('campushub_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    localStorage.setItem('campushub_user', JSON.stringify({ ...user, ...updatedData }));
  };

  // Quick Demo Account Switcher for seamless presentation & evaluation!
  const switchDemoRole = async (targetEmail, targetPassword = 'Password@123') => {
    let password = 'Admin@123';
    if (targetEmail.includes('leader')) password = 'Leader@123';
    else if (targetEmail.includes('interviewer')) password = 'Interviewer@123';
    else if (targetEmail.includes('student')) password = 'Student@123';
    else if (targetEmail.includes('volunteer')) password = 'Volunteer@123';

    return await login(targetEmail, password);
  };

  const isStudent = user?.role === 'STUDENT' || user?.role === 'CLUB_MEMBER';
  const isMember = user?.role === 'CLUB_MEMBER';
  const isLeader = user?.role === 'CLUB_LEADER' || user?.role === 'ADMIN';
  const isInterviewer = user?.role === 'INTERVIEWER' || user?.role === 'CLUB_LEADER' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        switchDemoRole,
        isStudent,
        isMember,
        isLeader,
        isInterviewer,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
