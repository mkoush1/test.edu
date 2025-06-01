import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [supervisorData, setSupervisorData] = useState(null);
  const [pendingAssessments, setPendingAssessments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is a supervisor
    const userType = localStorage.getItem('userType');
    const storedData = localStorage.getItem('userData');
    const token = localStorage.getItem('token');

    console.log('SupervisorDashboard initialization:', {
      userType, 
      hasStoredData: !!storedData,
      hasToken: !!token
    });

    if (!token || userType !== 'supervisor' || !storedData) {
      console.error('Authentication check failed - redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      setSupervisorData(parsedData);
      
      // Store supervisorId separately for easier access
      if (parsedData.supervisorId || parsedData.UserID) {
        localStorage.setItem('supervisorId', parsedData.supervisorId || parsedData.UserID);
      }
      
      console.log('Supervisor data loaded:', parsedData);
    } catch (error) {
      console.error('Error parsing supervisor data:', error);
      setError('Error loading supervisor data. Please try logging in again.');
      return;
    }
    
    // Fetch pending speaking assessments count
    fetchPendingAssessments();
  }, [navigate]);
  
  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      console.log('Fetching pending assessments...');
      
      const response = await axios.get('/api/speaking-assessment/pending');
      
      console.log('Pending assessments response:', response.data);
      
      if (response.data.success) {
        setPendingAssessments(response.data.assessments.length);
        console.log(`Found ${response.data.assessments.length} pending assessments`);
      } else {
        console.error('Failed to fetch pending assessments:', response.data.message);
        setError('Failed to load pending assessments');
      }
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
      setError('Error loading data from server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    localStorage.removeItem('supervisorId');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-center mb-2">Error</h2>
            <p className="text-center">{error}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!supervisorData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No supervisor data found. Please log in again.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Supervisor Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {supervisorData.fullName || supervisorData.Username || supervisorData.name || 'Supervisor'}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-md">
            <h2 className="text-2xl font-bold mb-6">Supervisor Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link 
                to="/supervisor/speaking-review" 
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-indigo-700">Speaking Assessments</h3>
                  {pendingAssessments > 0 ? (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {pendingAssessments} pending
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      No pending
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">Review and evaluate student speaking assessments</p>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-600 text-sm">View assessments</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Users</h3>
                <p className="text-gray-600">View and manage user accounts</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Reports</h3>
                <p className="text-gray-600">View and generate reports</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
                <p className="text-gray-600">Manage supervisor settings</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard; 