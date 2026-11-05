import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFleet } from '../context/FleetContext';
import { ROLES, UserRole } from '@ocean-pulse/shared';
import {
  Radio,
  AlertTriangle,
  Compass,
  Clock,
  Shield,
  LogOut,
  ChevronDown,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { isConnected, incidents, simulation } = useFleet();
  const location = useLocation();

  const [utcTime, setUtcTime] = useState('');
  const [istTime, setIstTime] = useState('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
      setIstTime(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeSOSCount = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.priority === 'CRITICAL'
  ).length;

  const isShore = location.pathname.startsWith('/shore');
  const isFisher = location.pathname.startsWith('/fisherman');

  return (
    <header className="bg-ocean-950/80 backdrop-blur-xl border-b border-cyan-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm select-none z-30 shadow-lg shadow-black/40">
      {/* Brand Identity */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-pulse-cyan flex items-center justify-center text-ocean-950 font-black shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-400/50 transition-all duration-300">
            <Radio className="w-5 h-5 text-ocean-950 animate-pulse" />
            <div className="absolute inset-0 rounded-xl border border-white/40" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-pulse-cyan transition-colors text-glow-cyan">
                OCEAN PULSE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-cyan-950/80 text-pulse-cyan border border-cyan-400/40 shadow-sm shadow-cyan-900/40">
                DIGITAL TWIN
              </span>
            </div>
            <p className="text-[11px] text-ocean-300 hidden sm:block tracking-wide">
              Maritime Decision-Support & Fleet Coordination
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 ml-2">
          <Link
            to="/shore"
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all duration-200 ${
              isShore
                ? 'bg-gradient-to-r from-ocean-800 to-ocean-700 text-pulse-cyan border border-cyan-400/40 shadow-glow-cyan-sm'
                : 'text-ocean-200 hover:text-white hover:bg-ocean-800/80 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Shore Command
          </Link>
          <Link
            to="/fisherman"
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all duration-200 ${
              isFisher
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 shadow-glow-safe'
                : 'text-ocean-200 hover:text-white hover:bg-ocean-800/80 border border-transparent'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Fisherman HUD
          </Link>
          <Link
            to="/status"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ocean-300 hover:text-white hover:bg-ocean-800/60 hidden md:block transition-colors"
          >
            System Status
          </Link>
          <Link
            to="/about"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ocean-300 hover:text-white hover:bg-ocean-800/60 hidden md:block transition-colors"
          >
            About & Pitch
          </Link>
        </nav>
      </div>

      {/* Operational Clocks & Telemetry Freshness */}
      <div className="flex items-center gap-3">
        {/* Simulation Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-ocean-900/80 border border-ocean-700/80 text-xs font-mono shadow-inner">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-pulse-cyan font-bold tracking-wider">T+{Math.floor(simulation?.simTimeMinutes || 0)}m</span>
          <span className="text-ocean-600">|</span>
          <span className="text-ocean-200">{istTime}</span>
        </div>

        {/* Operating Mode Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-300 shadow-sm shadow-amber-950/40">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold tracking-wide">SIMULATED DATA</span>
        </div>

        {/* Active Emergency SOS Pill */}
        {activeSOSCount > 0 ? (
          <Link
            to="/shore"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/80 border border-pulse-critical text-pulse-critical text-xs font-black shadow-glow-critical animate-distress"
          >
            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            {activeSOSCount} ACTIVE SOS
          </Link>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            0 Distress
          </div>
        )}

        {/* User Role & Demo Account Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ocean-900 border border-cyan-500/30 hover:border-cyan-400 text-xs text-white transition-all shadow-sm hover:shadow-cyan-500/20"
          >
            <Shield className="w-3.5 h-3.5 text-pulse-cyan" />
            <span className="font-bold max-w-[130px] truncate">
              {user ? user.role.replace('_', ' ') : 'Demo User'}
            </span>
            <ChevronDown className="w-3 h-3 text-cyan-300" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-ocean-950/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl py-2 z-50 animate-fade-in divide-y divide-ocean-800">
              <div className="px-3.5 py-2">
                <p className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">
                  Quick Switch Role (Evaluator)
                </p>
                <p className="text-xs text-white truncate font-semibold mt-0.5">{user?.name}</p>
              </div>
              <div className="py-1">
                {(
                  [
                    [ROLES.SHORE_OPERATOR, 'Shore Operator', 'Manage fleet, view digital twin & incidents'],
                    [ROLES.FISHERMAN, 'Fisherman (B01 Sagar Kanya)', 'Touch HUD, multilingual voice & SOS'],
                    [ROLES.SUPERVISOR, 'Supervisor (Coast Guard)', 'MRCC escalations & emergency approvals'],
                    [ROLES.ADMIN, 'System Administrator', 'Telemetry adapters & security config'],
                    [ROLES.DEMO_VIEWER, 'Demo Viewer', 'Read-only evaluation for judges'],
                  ] as const
                ).map(([r, title, desc]) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchDemoRole(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs hover:bg-ocean-850 flex flex-col transition-colors ${
                      user?.role === r
                        ? 'bg-cyan-950/60 text-pulse-cyan font-bold border-l-2 border-pulse-cyan'
                        : 'text-ocean-100'
                    }`}
                  >
                    <span className="font-semibold">{title}</span>
                    <span className="text-[10px] text-ocean-300 font-normal">{desc}</span>
                  </button>
                ))}
              </div>
              <div className="pt-1 px-1">
                <button
                  onClick={() => {
                    logout();
                    setRoleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
