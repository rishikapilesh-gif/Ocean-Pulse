import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FleetProvider } from './context/FleetContext';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ShoreConsole } from './pages/ShoreConsole';
import { FishermanHUD } from './pages/FishermanHUD';
import { StatusPage } from './pages/StatusPage';
import { AboutPage } from './pages/AboutPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-950 flex items-center justify-center text-white text-sm">
        Initializing Ocean Pulse...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FleetProvider>
          <div className="min-h-screen bg-ocean-950 text-ocean-50 flex flex-col font-sans">
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/shore"
                  element={
                    <ProtectedRoute>
                      <ShoreConsole />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fisherman"
                  element={
                    <ProtectedRoute>
                      <FishermanHUD />
                    </ProtectedRoute>
                  }
                />
                <Route path="/status" element={<StatusPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </FleetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
