import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Visions from './pages/Visions';
import Goals from './pages/Goals';
import Tactics from './pages/Tactics';
import WeeklyTracking from './pages/WeeklyTracking';
import WeeklyPlans from './pages/WeeklyPlans';
import WAM from './pages/WAM';
import Scorecard from './pages/Scorecard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visions"
            element={
              <ProtectedRoute>
                <Visions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tactics"
            element={
              <ProtectedRoute>
                <Tactics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tracking"
            element={
              <ProtectedRoute>
                <WeeklyTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/weekly-plans"
            element={
              <ProtectedRoute>
                <WeeklyPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wam"
            element={
              <ProtectedRoute>
                <WAM />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scorecard"
            element={
              <ProtectedRoute>
                <Scorecard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
