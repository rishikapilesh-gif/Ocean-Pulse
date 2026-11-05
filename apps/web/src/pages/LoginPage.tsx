import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, UserRole } from '@ocean-pulse/shared';
import { Radio, Lock, Mail, Shield, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/shore');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole, targetRoute: string) => {
    setError('');
    setLoading(true);
    try {
      await switchDemoRole(role);
      navigate(targetRoute);
    } catch (err: any) {
      setError(err.message || 'Demo role switch failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ocean-950 flex flex-col justify-center items-center p-4 select-none">
      <div className="max-w-md w-full bg-ocean-900 border border-ocean-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-ocean-700 to-pulse-cyan mx-auto flex items-center justify-center text-ocean-950 shadow-lg">
            <Radio className="w-6 h-6 text-ocean-950" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">OCEAN PULSE</h1>
          <p className="text-xs text-ocean-300">
            Sign in to access the Shore Safety Command Center or Fisherman HUD
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-ocean-300 mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@oceanpulse.org"
                className="w-full bg-ocean-950 border border-ocean-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-ocean-500 focus:outline-none focus:border-pulse-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-ocean-300 mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-ocean-950 border border-ocean-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-ocean-500 focus:outline-none focus:border-pulse-cyan"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-pulse-cyan hover:bg-cyan-400 text-ocean-950 font-bold text-xs tracking-wide transition-colors shadow-lg shadow-pulse-cyan/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* One-Click Evaluator Accounts */}
        <div className="border-t border-ocean-800 pt-4 space-y-2">
          <span className="text-[10px] font-bold text-ocean-400 uppercase tracking-wider block text-center">
            Or Choose A Pre-Configured Demo Account
          </span>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <button
              onClick={() => handleQuickRole(ROLES.SHORE_OPERATOR, '/shore')}
              className="w-full py-2 px-3 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-left border border-ocean-600 flex items-center justify-between text-white"
            >
              <div>
                <span className="font-bold">Shore Operator</span>
                <span className="block text-[10px] text-ocean-300">Kavitha Menath (Kochi Command)</span>
              </div>
              <span className="text-[10px] text-pulse-cyan font-bold">Launch Console →</span>
            </button>

            <button
              onClick={() => handleQuickRole(ROLES.FISHERMAN, '/fisherman')}
              className="w-full py-2 px-3 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-left border border-ocean-600 flex items-center justify-between text-white"
            >
              <div>
                <span className="font-bold">Artisanal Fisherman</span>
                <span className="block text-[10px] text-ocean-300">Antony Joseph (B01 Sagar Kanya)</span>
              </div>
              <span className="text-[10px] text-pulse-safe font-bold">Launch HUD →</span>
            </button>

            <button
              onClick={() => handleQuickRole(ROLES.SUPERVISOR, '/shore')}
              className="w-full py-2 px-3 rounded-lg bg-ocean-800 hover:bg-ocean-700 text-left border border-ocean-600 flex items-center justify-between text-white"
            >
              <div>
                <span className="font-bold">Coast Guard Supervisor</span>
                <span className="block text-[10px] text-ocean-300">Cmdr. Suresh Babu (MRCC)</span>
              </div>
              <span className="text-[10px] text-purple-300 font-bold">Access →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
