import React, { useState, useEffect } from 'react';
import { useFleet } from '../../context/FleetContext';
import { api } from '../../services/api';
import { AICopilotBrief } from '@ocean-pulse/shared';
import { Bot, RefreshCw, CheckCircle, ShieldCheck, Tag, AlertTriangle } from 'lucide-react';

export const AICopilotPanel: React.FC = () => {
  const { selectedVesselId, selectedVessel } = useFleet();
  const [brief, setBrief] = useState<AICopilotBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);

  const fetchBrief = async () => {
    if (!selectedVesselId) return;
    setLoading(true);
    try {
      const res = await api.getCopilotBrief(selectedVesselId);
      setBrief(res.brief);
    } catch (err) {
      console.warn('[AICopilot] Brief load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoUpdate && selectedVesselId) {
      fetchBrief();
    }
  }, [selectedVesselId, autoUpdate]);

  return (
    <div className="flex flex-col h-full bg-ocean-950 text-xs p-3 space-y-3 overflow-y-auto select-none border-l border-ocean-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ocean-700 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-ocean-800 flex items-center justify-center text-pulse-cyan border border-ocean-600">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Local AI Safety Copilot</h3>
            <p className="text-[10px] text-ocean-300">Evidence-grounded operational briefing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] text-ocean-300 flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={(e) => setAutoUpdate(e.target.checked)}
              className="rounded bg-ocean-900 border-ocean-700 text-pulse-cyan focus:ring-0"
            />
            Auto
          </label>
          <button
            onClick={fetchBrief}
            disabled={loading}
            className="p-1 rounded bg-ocean-800 hover:bg-ocean-700 text-ocean-200 border border-ocean-600 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-pulse-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* Verified Evidence Badges */}
      {brief?.evidenceTags && (
        <div>
          <span className="text-[10px] font-semibold text-ocean-300 uppercase tracking-wider block mb-1">
            Verified Input Evidence
          </span>
          <div className="flex flex-wrap gap-1">
            {brief.evidenceTags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-[10px] bg-ocean-900 border border-ocean-700 text-ocean-200 flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5 text-pulse-cyan" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Brief Sections */}
      {brief ? (
        <div className="space-y-2.5 bg-ocean-900/80 border border-ocean-700 p-3 rounded-lg text-ocean-100">
          <div>
            <strong className="block text-[10px] font-extrabold uppercase text-pulse-cyan tracking-wider">
              PRIORITY
            </strong>
            <p className="text-xs font-semibold text-white mt-0.5">{brief.prioritySection}</p>
          </div>

          <div>
            <strong className="block text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
              WHY THIS RATING
            </strong>
            <p className="text-[11px] text-ocean-200 mt-0.5 leading-relaxed">{brief.whySection}</p>
          </div>

          <div>
            <strong className="block text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">
              RECOMMENDED ACTION
            </strong>
            <p className="text-[11px] text-ocean-200 mt-0.5 leading-relaxed">{brief.whatToDoSection}</p>
          </div>

          <div>
            <strong className="block text-[10px] font-extrabold uppercase text-ocean-400 tracking-wider">
              DATA LIMITATIONS & SENSOR BOUNDS
            </strong>
            <p className="text-[10px] text-ocean-300 mt-0.5 leading-relaxed italic">
              {brief.dataLimitationsSection}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-ocean-400">
          Click &quot;Generate AI Brief&quot; or select a vessel to view verified briefing.
        </div>
      )}

      {/* Safety Policy Disclaimer */}
      <div className="p-2.5 rounded bg-ocean-950 border border-ocean-800 text-[10px] text-ocean-300 space-y-1">
        <div className="flex items-center gap-1 text-pulse-cyan font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Safety & Decision Integrity Policy</span>
        </div>
        <p>
          The AI Copilot operates strictly on verified telemetry and deterministic risk scores. It cannot
          fabricate sensor readings, override mathematical calculations, or declare a vessel safe without data.
        </p>
      </div>
    </div>
  );
};
