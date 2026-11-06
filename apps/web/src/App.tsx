import React, { Component, ErrorInfo, ReactNode } from 'react';
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

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Ocean Pulse Error Boundary Caught]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ocean-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-pulse-cyan/20 border border-pulse-cyan flex items-center justify-center text-pulse-cyan text-2xl font-bold animate-pulse">
            🌊
          </div>
          <h1 className="text-xl font-black text-white">Ocean Pulse — Maritime Safety Platform</h1>
          <p className="text-xs text-ocean-300 max-w-md">
            The operational view encountered a transient display event. Click below to refresh the console immediately.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-pulse-cyan text-ocean-950 font-bold text-xs shadow-lg hover:bg-cyan-300 transition-all"
          >
            Reload Maritime Console
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
