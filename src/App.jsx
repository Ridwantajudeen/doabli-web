import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Public Pages
import LandingPage from './pages/LandingPage';
import Signup from './pages/Signup';
import Login from './pages/Login';

// Client Pages
import ClientDashboard from './pages/ClientDashboard';
import ErrandDetails from './pages/client/ErrandDetails';
import CreateErrand from './pages/client/CreateErrand';
import RunnerProfile from './pages/client/RunnerProfile';
import Chat from './pages/client/Chat';

// Runner Pages
import RunnerDashboard from './pages/RunnerDashboard';
import JobDetails from './pages/runner/JobDetails';
// Admin
import AdminDashboard from './pages/admin/AdminDashboard';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh for 5 mins
      gcTime: 1000 * 60 * 10, // 10 minutes - cache keeps data for 10 mins
      retry: 1, // Only retry once on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />

              {/* Client Protected Routes */}
              <Route
                path="/client"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/home"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/errands"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/messages"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/notifications"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/profile"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/errand-details/:id"
                element={
                  <ProtectedRoute>
                    <ErrandDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/create-errand"
                element={
                  <ProtectedRoute>
                    <CreateErrand />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/runner-profile/:id"
                element={
                  <ProtectedRoute>
                    <RunnerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/chat/:partnerId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />

              {/* Runner Protected Routes */}
              <Route
                path="/runner"
                element={
                  <ProtectedRoute>
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/home"
                element={
                  <ProtectedRoute>
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/applications"
                element={
                  <ProtectedRoute>
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/messages"
                element={
                  <ProtectedRoute>
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/notifications"
                element={
                  <ProtectedRoute>
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/profile"
                element={
                  <ProtectedRoute>
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/job-details/:id"
                element={
                  <ProtectedRoute>
                    <JobDetails />
                  </ProtectedRoute>
                }
              />
              {/* Admin Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/chat/:partnerId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
          </>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;