import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { VesselState } from '@ocean-pulse/shared';
import {
  Search,
  Filter,
  AlertTriangle,
  Radio,
  WifiOff,
  Wrench,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const FleetList: React.FC = () => {
  const { vessels, selectedVesselId, setSelectedVesselId } = useFleet();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch =
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.master.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.regNo.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'DISTRESS') return v.activeDistress;
    if (filterLevel === 'LOST_COMMS') return v.commState === 'lost';
    if (filterLevel === 'ENGINE_FAULT') return v.engineFault;
    return v.assessment?.level === filterLevel;
  });

  const counts = {
    Critical: vessels.filter((v) => v.assessment?.level === 'Critical').length,
    High: vessels.filter((v) => v.assessment?.level === 'High').length,
    Medium: vessels.filter((v) => v.assessment?.level === 'Medium').length,
    Safe: vessels.filter((v) => v.assessment?.level === 'Safe').length,
    Distress: vessels.filter((v) => v.activeDistress).length,
  };

  return (
    <div className="flex flex-col h-full bg-ocean-950/90 backdrop-blur-md border-r border-ocean-700/70 w-full select-none">
      {/* Search & Header */}
      <div className="p-3.5 border-b border-ocean-800/80 space-y-2.5 bg-gradient-to-b from-ocean-900/60 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-pulse-cyan to-white bg-clip-text text-transparent font-black tracking-wide uppercase text-xs">Fleet Urgency</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ocean-800 border border-ocean-700 text-ocean-300">
              {vessels.length}
            </span>
          </h2>
          <span className="text-[10px] text-ocean-400 font-mono tracking-tight uppercase">Deterministic Priority</span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
          <input
            type="text"
            placeholder="Search ID, vessel, master or reg..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-ocean-900/90 border border-ocean-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-ocean-50 placeholder-ocean-500 focus:outline-none focus:border-pulse-cyan focus:ring-1 focus:ring-pulse-cyan/30 transition-all shadow-inner"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
              filterLevel === 'ALL'
                ? 'bg-pulse-cyan/15 border-pulse-cyan text-pulse-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'border-ocean-750 text-ocean-300 hover:text-white hover:border-ocean-600 bg-ocean-900/40'
            }`}
          >
            All ({vessels.length})
          </button>
          {counts.Critical > 0 && (
            <button
              onClick={() => setFilterLevel('Critical')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                filterLevel === 'Critical'
                  ? 'bg-pulse-critical text-white border-pulse-critical shadow-[0_0_14px_rgba(255,26,64,0.5)]'
                  : 'bg-pulse-critical/10 text-rose-300 border-pulse-critical/40 hover:bg-pulse-critical/20'
              }`}
            >
              Critical ({counts.Critical})
            </button>
          )}
          {counts.High > 0 && (
            <button
              onClick={() => setFilterLevel('High')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
                filterLevel === 'High'
                  ? 'bg-pulse-high text-white border-pulse-high shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                  : 'bg-pulse-high/10 text-orange-300 border-pulse-high/40 hover:bg-pulse-high/20'
              }`}
            >
              High ({counts.High})
            </button>
          )}
          <button
            onClick={() => setFilterLevel('Medium')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              filterLevel === 'Medium'
                ? 'bg-pulse-medium text-ocean-950 border-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-pulse-medium/10 text-amber-300 border-pulse-medium/30 hover:bg-pulse-medium/20'
            }`}
          >
            Medium ({counts.Medium})
          </button>
          <button
            onClick={() => setFilterLevel('Safe')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              filterLevel === 'Safe'
                ? 'bg-pulse-safe text-white border-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-pulse-safe/10 text-emerald-300 border-pulse-safe/30 hover:bg-pulse-safe/20'
            }`}
          >
            Safe ({counts.Safe})
          </button>
          <button
            onClick={() => setFilterLevel('LOST_COMMS')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
              filterLevel === 'LOST_COMMS'
                ? 'bg-ocean-800 text-white border-pulse-cyan'
                : 'border-ocean-800 text-ocean-400 hover:text-white bg-ocean-900/30'
            }`}
          >
            Lost Comms
          </button>
        </div>
      </div>

      {/* Vessel List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ocean-800/60 scrollbar-thin">
        {filteredVessels.length === 0 ? (
          <div className="p-6 text-center text-ocean-400 text-xs">
            No vessels match the selected filter.
          </div>
        ) : (
          filteredVessels.map((v, idx) => {
            const isSel = v.id === selectedVesselId;
            const a = v.assessment;
            const level = a?.level || 'Safe';

            const levelBorder =
              level === 'Critical'
                ? 'border-l-pulse-critical shadow-[inset_4px_0_12px_rgba(255,26,64,0.15)]'
                : level === 'High'
                ? 'border-l-pulse-high shadow-[inset_4px_0_12px_rgba(249,115,22,0.12)]'
                : level === 'Medium'
                ? 'border-l-pulse-medium shadow-[inset_4px_0_12px_rgba(245,158,11,0.1)]'
                : 'border-l-pulse-safe shadow-[inset_4px_0_12px_rgba(16,185,129,0.08)]';

            const badgeBg =
              level === 'Critical'
                ? 'bg-pulse-critical text-white shadow-[0_0_8px_rgba(255,26,64,0.4)]'
                : level === 'High'
                ? 'bg-pulse-high text-white shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                : level === 'Medium'
                ? 'bg-pulse-medium text-ocean-950 font-bold'
                : 'bg-pulse-safe text-white';

            return (
              <div
                key={v.id}
                onClick={() => setSelectedVesselId(v.id)}
                className={`p-3 cursor-pointer transition-all border-l-4 ${levelBorder} flex items-center justify-between gap-3 ${
                  isSel
                    ? 'bg-gradient-to-r from-ocean-800/90 to-ocean-850/90 ring-1 ring-pulse-cyan/40 shadow-md'
                    : 'hover:bg-ocean-900/60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white truncate tracking-wide">
                      {v.id} — {v.name}
                    </span>
                    {v.activeDistress && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-pulse-critical text-white animate-pulse tracking-wider">
                        SOS
                      </span>
                    )}
                    {v.engineFault && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ENG FAULT
                      </span>
                    )}
                    {v.commState === 'lost' && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        NO COMMS
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-ocean-300 truncate mt-0.5">
                    {a?.timeToDangerLabel || 'Nominal course'}
                  </p>

                  <div className="flex items-center gap-2.5 text-[10px] text-ocean-400 mt-1 font-mono">
                    <span>
                      {v.commState === 'good' ? (
                        <span className="text-pulse-teal font-semibold">● Good</span>
                      ) : v.commState === 'weak' ? (
                        <span className="text-pulse-medium font-semibold">● Weak</span>
                      ) : (
                        <span className="text-pulse-critical font-semibold">
                          ● Lost {Math.round(v.lastContactMinAgo)}m ago
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>Conf: {a?.confidence ?? 0}%</span>
                    <span>•</span>
                    <span>{Math.round(v.effectiveSpeedKmh)} km/h</span>
                  </div>
                </div>

                {/* Risk score badge */}
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${badgeBg}`}>
                    {level.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {a?.scenarioRiskScore ?? 0}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
