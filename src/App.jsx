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
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/home"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/errands"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/messages"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/notifications"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/profile"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/errand-details/:id"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ErrandDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/create-errand"
                element={
                  <ProtectedRoute requiredRole="client">
                    <CreateErrand />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/runner-profile/:id"
                element={
                  <ProtectedRoute requiredRole="client">
                    <RunnerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client/chat/:partnerId"
                element={
                  <ProtectedRoute requiredRole="client">
                    <Chat />
                  </ProtectedRoute>
                }
              />

              {/* Runner Protected Routes */}
              <Route
                path="/runner"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/home"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/applications"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/messages"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/notifications"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/profile"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <RunnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/job-details/:id"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <JobDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/runner/chat/:partnerId"
                element={
                  <ProtectedRoute requiredRole="runner">
                    <Chat />
                  </ProtectedRoute>
                }
              />
              {/* Admin Route */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
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