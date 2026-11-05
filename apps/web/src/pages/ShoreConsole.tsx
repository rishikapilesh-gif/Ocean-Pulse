import React, { useState, useEffect } from 'react';
import { OceanMap } from '../features/digital-twin/OceanMap';
import { FleetList } from '../features/fleet/FleetList';
import { VesselDetailPanel } from '../features/fleet/VesselDetailModal';
import { IncidentCenter } from '../features/incidents/IncidentCenter';
import { AssistanceCoordinator } from '../features/incidents/AssistanceCoordinator';
import { AICopilotPanel } from '../features/shore/AICopilotPanel';
import { SimulationToolbar } from '../features/shore/SimulationToolbar';
import { useFleet } from '../context/FleetContext';
import {
  Layers,
  AlertTriangle,
  LifeBuoy,
  Bot,
  Activity,
  Sliders,
  ChevronRight,
  Maximize2,
  Wind,
  Waves,
  Thermometer,
  Radio,
  Volume2,
  VolumeX,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const ShoreConsole: React.FC = () => {
  const { incidents, requests, vessels, storm } = useFleet();
  const [activeTab, setActiveTab] = useState<'fleet' | 'incidents' | 'assistance' | 'ai'>('fleet');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState(
    'IMMEDIATE ADVISORY: Cyclone approaching Kochi offshore sector. All non-mechanized vessels alter course 045° towards safe anchorage.'
  );

  const activeSOSCount = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.priority === 'CRITICAL'
  ).length;

  const pendingRequestsCount = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'ACKNOWLEDGED'
  ).length;

  const criticalVessels = vessels.filter((v) => v.assessment?.level === 'Critical');

  // Trigger auditory warning beep when a critical SOS is detected
  useEffect(() => {
    if (activeSOSCount > 0 && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High alarm pitch
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch (e) {
        // AudioContext requires user gesture in some browsers
      }
    }
  }, [activeSOSCount, soundEnabled]);

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastOpen(false);
    }, 2200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] bg-ocean-950 overflow-hidden select-none">
      {/* Live Marine Telemetry & Sea State Header Bar */}
      <div className="bg-ocean-950/95 border-b border-ocean-800/80 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-ocean-200 backdrop-blur-md z-30">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pulse-teal animate-ping" />
            <span className="font-mono text-[11px] font-bold text-white tracking-wide uppercase">
              INCOIS Ocean Twin Live
            </span>
            <span className="px-1.5 py-0.5 rounded bg-ocean-900 border border-ocean-700 text-[10px] text-ocean-300">
              Arabian Sea Shelf
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono border-l border-ocean-800 pl-4">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Waves className="w-3.5 h-3.5 text-pulse-cyan" />
              <span>Swell: <strong>2.8m</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-ocean-100">
              <Wind className="w-3.5 h-3.5 text-pulse-cyan" />
              <span>Wind: <strong>{Math.round((storm?.speedKmh || 32) * 0.539957)} kts</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              <span>SST: <strong>29.4°C</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Cyclone: <strong>Cat-1 ({Math.round(storm?.radiusKm || 14)}km)</strong></span>
            </span>
          </div>
        </div>

        {/* Quick Operator Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-ocean-900 border-ocean-700 text-ocean-300 hover:text-white'
                : 'bg-rose-950/40 border-rose-600 text-rose-300'
            }`}
            title="Toggle Emergency Siren Chime"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-pulse-teal" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{soundEnabled ? 'Siren Active' : 'Muted'}</span>
          </button>

          {/* Quick Fleet Broadcast Button */}
          <button
            onClick={() => setBroadcastOpen(true)}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gradient-to-r from-pulse-cyan/20 to-teal-500/20 border border-pulse-cyan/60 text-pulse-cyan hover:bg-pulse-cyan hover:text-ocean-950 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast Advisory</span>
            {criticalVessels.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-pulse-critical text-white text-[10px] flex items-center justify-center font-black">
                {criticalVessels.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Controls Strip */}
      <SimulationToolbar />

      {/* Main Command Center Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Digital Ocean Twin Geographic Map */}
        <div className="flex-1 h-full relative">
          <OceanMap />
        </div>

        {/* Right: Operational Panels (Fleet, Incidents, Assistance, AI Copilot) */}
        <div className="w-[440px] xl:w-[480px] h-full flex flex-col bg-ocean-950/90 backdrop-blur-xl border-l border-ocean-800 shadow-2xl z-10">
          {/* Panel Selector Tabs */}
          <div className="flex items-center bg-ocean-950 border-b border-ocean-800/80 px-2 pt-2 gap-1 select-none text-xs">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'fleet'
                  ? 'border-pulse-cyan text-pulse-cyan bg-gradient-to-t from-ocean-900/60 to-transparent shadow-[0_2px_10px_rgba(0,240,255,0.2)]'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Fleet</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'incidents'
                  ? 'border-pulse-critical text-pulse-critical bg-gradient-to-t from-rose-950/40 to-transparent shadow-[0_2px_10px_rgba(255,26,64,0.3)]'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Distress</span>
              {activeSOSCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-pulse-critical text-white text-[10px] flex items-center justify-center font-black animate-pulse">
                  {activeSOSCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('assistance')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'assistance'
                  ? 'border-amber-400 text-amber-300 bg-gradient-to-t from-amber-950/40 to-transparent shadow-[0_2px_10px_rgba(245,158,11,0.2)]'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Logistics</span>
              {pendingRequestsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-ocean-950 text-[10px] flex items-center justify-center font-black">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'ai'
                  ? 'border-pulse-cyan text-pulse-cyan bg-gradient-to-t from-ocean-900/60 to-transparent shadow-[0_2px_10px_rgba(0,240,255,0.2)]'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Copilot</span>
            </button>
          </div>

          {/* Panel Views */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'fleet' && (
              <div className="h-full flex flex-col">
                <div className="h-1/2 border-b border-ocean-800">
                  <FleetList />
                </div>
                <div className="h-1/2 overflow-y-auto">
                  <VesselDetailPanel />
                </div>
              </div>
            )}

            {activeTab === 'incidents' && (
              <div className="h-full overflow-y-auto">
                <IncidentCenter />
              </div>
            )}

            {activeTab === 'assistance' && (
              <div className="h-full overflow-y-auto">
                <AssistanceCoordinator />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="h-full overflow-y-auto">
                <AICopilotPanel />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operator Fleet Broadcast Modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 bg-ocean-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-ocean-900 border border-pulse-cyan/50 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-pulse-cyan" />
                <span>Transmit VHF / NavIC Fleet Broadcast</span>
              </h3>
              <button
                onClick={() => setBroadcastOpen(false)}
                className="text-ocean-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-ocean-300">
              Transmits an urgent digital advisory to all {vessels.length} tracked vessels and ISRO DAT satellite receivers.
            </p>

            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              rows={3}
              className="w-full bg-ocean-950 border border-ocean-700 rounded-xl p-3 text-xs text-white placeholder-ocean-500 focus:outline-none focus:border-pulse-cyan resize-none"
            />

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Targeting: <strong>{criticalVessels.length} critical vessels</strong> in cyclone corridor</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBroadcastOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ocean-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={broadcastSent}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-pulse-cyan hover:bg-cyan-400 text-ocean-950 flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
              >
                {broadcastSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-ocean-950" />
                    <span>Transmitted to Fleet!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Urgent Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
