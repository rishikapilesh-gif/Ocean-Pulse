import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FleetProvider } from './context/FleetContext';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ShoreConsole } from './pages/ShoreConsole';
import { FishermanHUD } from './pages/FishermanHUD';
import { StatusPage } from './pages/StatusPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <FleetProvider>
          <div className="min-h-screen bg-ocean-950 text-ocean-50 flex flex-col font-sans">
            <Header />
            <div className="flex-1">
              <Routes>
                {/* Landing & Overview */}
                <Route path="/" element={<LandingPage />} />
                
                {/* 100% Direct Open Access — ZERO Password Required */}
                <Route path="/shore" element={<ShoreConsole />} />
                <Route path="/fisherman" element={<FishermanHUD />} />
                <Route path="/hud" element={<FishermanHUD />} />
                
                {/* Informational Pages */}
                <Route path="/status" element={<StatusPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Catch-all redirect to Landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </FleetProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
