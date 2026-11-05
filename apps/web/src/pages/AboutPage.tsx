import React from 'react';
import { ShieldCheck, Anchor, Compass, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-xs text-ocean-100 leading-relaxed">
      {/* Title */}
      <div className="border-b border-ocean-700 pb-4 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ocean-900 border border-ocean-700 text-pulse-cyan text-[11px] font-bold">
          SELF(E) HACKATHON 2026 • MARITIME SAFETY
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white">
          Ocean Pulse — Fleet Attention & Digital Ocean Twin
        </h1>
        <p className="text-ocean-300 text-sm">
          A software-first maritime safety decision-support layer connecting ocean forecasts, vessel state, risk prioritization, and fisher coordination.
        </p>
      </div>

      {/* The Problem & Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 space-y-1">
          <span className="text-2xl font-black text-pulse-cyan">35.74 Lakh</span>
          <h3 className="font-bold text-white text-xs">Active Fishers (GAIS)</h3>
          <p className="text-[11px] text-ocean-300">
            Enrolled annually under the Group Accident Insurance Scheme across coastal states.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 space-y-1">
          <span className="text-2xl font-black text-pulse-cyan">20,000+</span>
          <h3 className="font-bold text-white text-xs">ISRO DAT Terminals</h3>
          <p className="text-[11px] text-ocean-300">
            Distress Alert Terminals deployed by ISRO for satellite-enabled search and rescue.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 space-y-1">
          <span className="text-2xl font-black text-pulse-cyan">10 Days</span>
          <h3 className="font-bold text-white text-xs">INCOIS SVAS Advisories</h3>
          <p className="text-[11px] text-ocean-300">
            Small Vessel Advisory Services warn small-craft operators of potential overturning zones up to 10 days ahead.
          </p>
        </div>
      </div>

      {/* The Core Gap */}
      <div className="bg-ocean-900/80 border border-ocean-700 rounded-xl p-5 space-y-3">
        <h2 className="text-base font-bold text-white">The Operational Challenge</h2>
        <p className="text-ocean-200">
          The challenge in maritime safety is not the complete absence of information — it is converting vast, fragmented ocean data into the <strong>right action for the right vessel at the right time</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
          <div className="p-3 rounded-lg bg-ocean-950 border border-ocean-800 space-y-1">
            <strong className="text-white block font-semibold">1. Fragmented Signals</strong>
            Weather forecasts (IMD), ocean state (INCOIS), vessel positions, and VHF radio signals exist in disparate silos.
          </div>
          <div className="p-3 rounded-lg bg-ocean-950 border border-ocean-800 space-y-1">
            <strong className="text-white block font-semibold">2. One Warning ≠ One Risk</strong>
            Two vessels in the same storm cell face totally different hazards depending on engine capability, hull size, heading, and radio range.
          </div>
          <div className="p-3 rounded-lg bg-ocean-950 border border-ocean-800 space-y-1">
            <strong className="text-white block font-semibold">3. Limited Shore Attention</strong>
            Command centers cannot scan hundreds of vessels simultaneously. They need deterministic urgency ranking to know who requires intervention first.
          </div>
        </div>
      </div>

      {/* 5-Minute Hackathon Demonstration Script */}
      <div className="bg-gradient-to-tr from-ocean-900 to-ocean-850 border border-pulse-cyan/50 rounded-xl p-5 space-y-3 shadow-xl">
        <h2 className="text-base font-bold text-pulse-cyan flex items-center gap-2">
          <Compass className="w-4 h-4" />
          5-Minute Evaluator Live Demonstration Script
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-[11px] text-ocean-200">
          <li>
            <strong>Digital Twin & Priority:</strong> Open <Link to="/shore" className="text-pulse-cyan underline font-bold">Shore Command</Link>. Notice how 10 vessels are automatically ranked by the authoritative backend risk engine based on 15-minute projected storm intersection.
          </li>
          <li>
            <strong>Inspect Vessel & What-If:</strong> Click on <strong>B01 (Sagar Kanya)</strong>. View the 15-minute horizon chart and explainable factors. Click &quot;Cut Comms&quot; or &quot;Trigger Glitch&quot; to see how confidence drops deterministically.
          </li>
          <li>
            <strong>AI Safety Copilot:</strong> Switch to the <strong>Copilot Tab</strong>. Generate an AI brief and verify how it strictly cites verified evidence tags without inventing telemetry.
          </li>
          <li>
            <strong>Fisherman Touch HUD:</strong> Open <Link to="/fisherman" className="text-pulse-safe underline font-bold">Fisherman HUD</Link> in another tab. Switch language to Malayalam or Tamil and click &quot;Speak Warning&quot; to hear speech synthesis.
          </li>
          <li>
            <strong>Press-and-Hold SOS:</strong> Hold down the SOS button for 2 seconds and transmit. Notice how the distress instantly appears on Shore Command with an audible indicator, updates the ranking, and allows operator acknowledgment!
          </li>
          <li>
            <strong>Offline Queue Reconciliation:</strong> Turn off network (or browser DevTools offline mode), submit an assistance request, restore network, and observe instant idempotent reconciliation.
          </li>
        </ol>
      </div>

      {/* Migration Checklist */}
      <div className="bg-ocean-900/60 border border-ocean-800 rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white">Prototype Migration Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Preserved pure deterministic risk engine & safe vector math</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Preserved 15-min horizon projections & confidence scoring</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Standardized product name everywhere to Ocean Pulse</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Upgraded to persistent SQLite / PostgreSQL backend via Prisma</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Added genuine mobile Fisherman HUD with press-and-hold SOS</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Added IndexedDB offline queue with idempotent retries</span>
          </div>
        </div>
      </div>
    </div>
  );
};
