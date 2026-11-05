import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, UserRole, APP_NAME, APP_TAGLINE } from '@ocean-pulse/shared';
import {
  Radio,
  Compass,
  Shield,
  Layers,
  Activity,
  AlertTriangle,
  ArrowRight,
  LifeBuoy,
  FileText,
  Anchor,
  Bot,
  Zap,
  Globe2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { switchDemoRole, user } = useAuth();

  return (
    <div className="min-h-screen bg-ocean-950 text-white flex flex-col justify-between selection:bg-pulse-cyan selection:text-ocean-950 relative overflow-hidden">
      {/* Ambient background glow elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/15 via-pulse-cyan/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center text-center space-y-9">
        {/* Hackathon Badge & Disclosure */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-ocean-900/90 border border-cyan-500/30 text-xs font-bold text-ocean-100 shadow-glow-cyan-sm backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-pulse-cyan animate-ping" />
          <span className="tracking-wide text-cyan-300">SELF(E) HACKATHON 2026</span>
          <span className="text-ocean-600">•</span>
          <span className="text-white font-semibold">Maritime Digital Ocean Twin</span>
        </div>

        {/* Hero Title & Tagline */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            See the risk.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pulse-cyan via-teal-300 to-pulse-safe text-glow-cyan">
              Prioritize the fleet.
            </span>{' '}
            <br className="hidden md:inline" />
            Protect lives.
          </h1>
          <p className="text-base md:text-xl text-ocean-200 max-w-3xl mx-auto leading-relaxed font-normal">
            <strong className="text-white font-bold">Ocean Pulse</strong> is an AI-assisted maritime decision-support and fleet coordination platform.
            It connects fragmented ocean forecasts, vessel telemetry, and radio communication states into an
            authoritative, explainable attention layer for shore safety operators and small-craft fishers.
          </p>
        </div>

        {/* Live Metrics Ticker Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-4xl pt-2">
          <div className="glass-card rounded-xl p-4 text-left border border-cyan-500/20 shadow-md">
            <span className="text-2xl font-black text-pulse-cyan tracking-tight">35.74 Lakh</span>
            <p className="text-xs font-bold text-white mt-0.5">Active Indian Fishers</p>
            <p className="text-[11px] text-ocean-300 mt-0.5">Enrolled annually under GAIS coverage</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-left border border-emerald-500/20 shadow-md">
            <span className="text-2xl font-black text-pulse-safe tracking-tight">20,000+</span>
            <p className="text-xs font-bold text-white mt-0.5">ISRO DAT Terminals</p>
            <p className="text-[11px] text-ocean-300 mt-0.5">Satellite distress alert beacons active</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-left border border-purple-500/20 shadow-md">
            <span className="text-2xl font-black text-purple-300 tracking-tight">10 Days Ahead</span>
            <p className="text-xs font-bold text-white mt-0.5">INCOIS SVAS Warnings</p>
            <p className="text-[11px] text-ocean-300 mt-0.5">Boat overturning advisory horizons</p>
          </div>
        </div>

        {/* Two Connected Interfaces Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl pt-2 text-left">
          {/* Shore Command Center */}
          <Link
            to="/shore"
            className="group relative p-7 rounded-2xl glass-panel hover:border-cyan-400/50 hover:bg-ocean-850/80 transition-all duration-300 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
            <div className="space-y-3.5 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 to-pulse-cyan p-3 inline-flex items-center justify-center text-ocean-950 font-black shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6 text-ocean-950" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-pulse-cyan uppercase">Command & Control</span>
                <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-pulse-cyan transition-colors mt-0.5">
                  Shore Safety Command Center
                </h2>
              </div>
              <p className="text-xs text-ocean-200 leading-relaxed font-normal">
                Geographic digital ocean twin with interactive nautical map, autonomous fleet urgency ranking,
                15-min hazard trajectory projections, multi-operator incident dispatch, and evidence-grounded AI copilot.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-pulse-cyan text-xs font-extrabold group-hover:translate-x-1.5 transition-transform">
              <span>Launch Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Fisherman Mobile HUD */}
          <Link
            to="/fisherman"
            className="group relative p-7 rounded-2xl glass-panel hover:border-emerald-400/50 hover:bg-ocean-850/80 transition-all duration-300 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="space-y-3.5 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-pulse-safe p-3 inline-flex items-center justify-center text-ocean-950 font-black shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 text-ocean-950" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">Onboard Vessel Cockpit</span>
                <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-pulse-safe transition-colors mt-0.5">
                  Fisherman Touch HUD
                </h2>
              </div>
              <p className="text-xs text-ocean-200 leading-relaxed font-normal">
                Mobile-first, sunlight-readable cockpit for fishers aboard small craft. Features press-and-hold
                emergency SOS (2-sec hold), multilingual audio alerts (Malayalam, Tamil, Hindi), evasive heading vectors,
                and resilient offline IndexedDB queueing.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-pulse-safe text-xs font-extrabold group-hover:translate-x-1.5 transition-transform">
              <span>Launch Fisherman Cockpit</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Quick Role Switcher for Hackathon Judges */}
        <div className="w-full max-w-4xl p-5 rounded-2xl glass-panel space-y-3 text-left border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-pulse-cyan flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Evaluator Quick Access (Pre-Configured Accounts)
            </h3>
            <span className="text-[11px] text-ocean-300">Click to switch roles instantly with zero password typing</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {(
              [
                [ROLES.SHORE_OPERATOR, 'Shore Operator', '/shore'],
                [ROLES.FISHERMAN, 'Fisherman (B01)', '/fisherman'],
                [ROLES.SUPERVISOR, 'Coast Guard Sup', '/shore'],
                [ROLES.ADMIN, 'System Admin', '/shore'],
                [ROLES.DEMO_VIEWER, 'Demo Viewer', '/shore'],
              ] as const
            ).map(([role, title, path]) => (
              <Link
                key={role}
                to={path}
                onClick={() => switchDemoRole(role)}
                className={`p-2.5 rounded-xl border text-center transition-all font-semibold flex flex-col justify-center items-center shadow-sm ${
                  user?.role === role
                    ? 'bg-pulse-cyan text-ocean-950 border-pulse-cyan font-black shadow-glow-cyan-sm'
                    : 'bg-ocean-900/80 border-ocean-700 text-ocean-200 hover:border-pulse-cyan hover:text-white hover:bg-ocean-800'
                }`}
              >
                <span>{title}</span>
                <span className="text-[10px] text-ocean-400 mt-0.5 font-normal">{role}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Key Architectural Differentiators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl pt-2 text-left text-xs">
          <div className="p-4 rounded-xl glass-card space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-pulse-cyan">
              <Activity className="w-4 h-4" />
              Deterministic Risk Engine
            </h4>
            <p className="text-ocean-300 text-[11px] leading-relaxed">
              Scoring is strictly rule-based, versioned (`v1.0`), and auditable. Projections model hazard proximity,
              vessel speed, heading, and equipment confidence.
            </p>
          </div>
          <div className="p-4 rounded-xl glass-card space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-pulse-cyan">
              <Bot className="w-4 h-4" />
              Evidence-Grounded AI Copilot
            </h4>
            <p className="text-ocean-300 text-[11px] leading-relaxed">
              AI serves exclusively to explain verified facts for operators. It never fabricates readings or
              overrides deterministic risk scores.
            </p>
          </div>
          <div className="p-4 rounded-xl glass-card space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-pulse-cyan">
              <LifeBuoy className="w-4 h-4" />
              Resilient Offline Queueing
            </h4>
            <p className="text-ocean-300 text-[11px] leading-relaxed">
              Fisherman HUD persists unsent distress in local IndexedDB with idempotency keys. On signal recovery,
              messages reconcile automatically.
            </p>
          </div>
        </div>
      </main>

      {/* Safety Disclaimer Banner */}
      <footer className="bg-ocean-950/90 border-t border-ocean-800 p-4 text-center text-xs text-ocean-400 select-none">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-bold text-ocean-300 tracking-wider text-[11px]">
            SAFETY & OPERATIONAL DISCLAIMER
          </p>
          <p className="text-[11px] text-ocean-400 leading-relaxed">
            Ocean Pulse is an academic prototype built for the SELF(E) 2026 Hackathon. It is not an officially certified
            SOLAS, GMDSS, or search-and-rescue platform. In actual maritime emergencies, always utilize official distress
            equipment (ISRO DAT, EPIRB, VHF Marine Radio Channel 16) and adhere to Indian Coast Guard / MRCC directives.
          </p>
        </div>
      </footer>
    </div>
  );
};
