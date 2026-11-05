import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { TRANSLATIONS, SupportedLanguage } from '@ocean-pulse/shared';
import {
  Compass,
  Radio,
  WifiOff,
  Wrench,
  AlertOctagon,
  Volume2,
  Navigation,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const VesselDetailPanel: React.FC = () => {
  const { selectedVessel, updateWhatIf } = useFleet();
  const [activeLang, setActiveLang] = useState<SupportedLanguage>('en');
  const [speechNotice, setSpeechNotice] = useState<string>('');

  if (!selectedVessel) {
    return (
      <div className="p-6 text-center text-ocean-400 text-xs">
        Select a vessel from the fleet list or map to inspect details.
      </div>
    );
  }

  const v = selectedVessel;
  const a = v.assessment;
  const advice = v.lastDeliveredWarning.level;
  const lang = TRANSLATIONS[activeLang];

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      setSpeechNotice('Speech synthesis unsupported in this browser.');
      return;
    }
    const text = lang.advice[advice];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang.code;
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeechNotice(`Synthesized speech in ${lang.name}`);
    setTimeout(() => setSpeechNotice(''), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-ocean-900 border-l border-ocean-700 overflow-y-auto text-xs p-3 space-y-3.5 select-none">
      {/* Vessel Header */}
      <div className="border-b border-ocean-700 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>{v.name}</span>
              <span className="font-mono text-xs text-pulse-cyan">({v.id})</span>
            </h3>
            <p className="text-[11px] text-ocean-300 mt-0.5">
              Master: <span className="text-white font-medium">{v.master}</span> • Reg: {v.regNo}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                a?.level === 'Critical'
                  ? 'bg-pulse-critical text-white'
                  : a?.level === 'High'
                  ? 'bg-pulse-high text-white'
                  : a?.level === 'Medium'
                  ? 'bg-pulse-medium text-ocean-950 font-bold'
                  : 'bg-pulse-safe text-white font-bold'
              }`}
            >
              {a?.level || 'SAFE'} {a?.scenarioRiskScore ?? 0}%
            </span>
          </div>
        </div>

        {/* Equipment Profile Chips */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] bg-ocean-800 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> GPS Active
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-ocean-800 text-ocean-200 border border-ocean-700">
            {v.equipment.comms} ({v.equipment.rangeKm}km)
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${
              v.equipment.hasWeatherReceiver
                ? 'bg-ocean-800 text-emerald-300 border-emerald-800/60'
                : 'bg-ocean-950 text-ocean-400 border-ocean-800 line-through'
            }`}
          >
            Weather Receiver
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${
              v.equipment.hasCompass
                ? 'bg-ocean-800 text-emerald-300 border-emerald-800/60'
                : 'bg-ocean-950 text-ocean-400 border-ocean-800 line-through'
            }`}
          >
            Compass
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 ${
              v.equipment.hasEngineSensor
                ? 'bg-ocean-800 text-emerald-300 border-emerald-800/60'
                : 'bg-ocean-950 text-ocean-400 border-ocean-800 line-through'
            }`}
          >
            Engine Sensor
          </span>
        </div>
      </div>

      {/* 15-Minute Risk Horizon Projections */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between font-semibold text-ocean-200">
          <span>Projected Scenario Risk Horizon</span>
          <span className="text-[10px] text-ocean-400">15-min outlook</span>
        </div>
        <div className="space-y-1">
          {(a?.horizons || []).map((h) => {
            const pct = Math.round(h.riskScore * 100);
            const barBg =
              pct >= 80 ? 'bg-pulse-critical' : pct >= 60 ? 'bg-pulse-high' : pct >= 35 ? 'bg-pulse-medium' : 'bg-pulse-safe';
            return (
              <div key={h.minute} className="flex items-center gap-2 text-[11px]">
                <span className="w-12 text-ocean-300">{h.minute === 0 ? 'Now' : `+${h.minute} min`}</span>
                <div className="flex-1 h-2 bg-ocean-950 rounded-full overflow-hidden border border-ocean-800">
                  <div className={`h-full rounded-full transition-all duration-300 ${barBg}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right font-mono font-bold text-ocean-100">{pct}%</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-ocean-300 pt-0.5">
          <span>Confidence: <strong className="text-white">{a?.confidence ?? 0}%</strong></span>
          <span className="text-ocean-400 italic">Data Quality: {a?.dataQuality || 'VERIFIED'}</span>
        </div>
      </div>

      {/* Why This Rating - Contributing Factors */}
      <div className="space-y-1.5">
        <h4 className="font-semibold text-ocean-200">Explainable Contributing Factors</h4>
        <div className="space-y-1">
          {(a?.factors || []).map((f, i) => (
            <div
              key={i}
              className={`p-1.5 rounded border-l-2 text-[11px] ${
                f.severity === 'crit'
                  ? 'bg-rose-950/30 border-rose-500 text-rose-200'
                  : f.severity === 'warn'
                  ? 'bg-amber-950/30 border-amber-500 text-amber-200'
                  : 'bg-ocean-800 border-ocean-500 text-ocean-300'
              }`}
            >
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Operator What-If Controls */}
      <div className="space-y-2 border-t border-ocean-700 pt-2.5">
        <h4 className="font-semibold text-ocean-200 flex items-center justify-between">
          <span>Simulate What-If On Vessel</span>
          <span className="text-[10px] text-pulse-cyan">Operator Sandbox</span>
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => updateWhatIf(v.id, { forceLostComms: !v.forceLost })}
            className={`px-2 py-1.5 rounded border text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
              v.forceLost
                ? 'bg-rose-900 border-rose-500 text-white font-bold'
                : 'bg-ocean-800 border-ocean-600 text-ocean-200 hover:text-white hover:border-pulse-cyan'
            }`}
          >
            <WifiOff className="w-3 h-3" />
            {v.forceLost ? 'Restore Comms' : 'Cut Comms'}
          </button>

          <button
            onClick={() => updateWhatIf(v.id, { triggerGpsGlitch: true })}
            className={`px-2 py-1.5 rounded border text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
              v.glitchActive
                ? 'bg-amber-800 border-amber-500 text-white font-bold'
                : 'bg-ocean-800 border-ocean-600 text-ocean-200 hover:text-white hover:border-pulse-cyan'
            }`}
          >
            <AlertOctagon className="w-3 h-3" />
            {v.glitchActive ? 'GPS Glitch Active' : 'Trigger Glitch'}
          </button>

          <button
            onClick={() => updateWhatIf(v.id, { toggleEngineFault: !v.engineFault })}
            disabled={!v.equipment.hasEngineSensor}
            title={v.equipment.hasEngineSensor ? '' : 'No onboard engine sensor installed'}
            className={`px-2 py-1.5 rounded border text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
              v.engineFault
                ? 'bg-rose-900 border-rose-500 text-white font-bold'
                : v.equipment.hasEngineSensor
                ? 'bg-ocean-800 border-ocean-600 text-ocean-200 hover:text-white'
                : 'bg-ocean-950 border-ocean-800 text-ocean-500 opacity-50 cursor-not-allowed'
            }`}
          >
            <Wrench className="w-3 h-3" />
            {v.engineFault ? 'Clear Eng Fault' : 'Engine Fault'}
          </button>

          <button
            onClick={() => {
              // Reroute 180 degrees backwards
              const newBearing = (v.bearingDeg + 180) % 360;
              updateWhatIf(v.id, { rerouteHeadingDeg: newBearing });
            }}
            className="px-2 py-1.5 rounded border border-ocean-600 bg-ocean-800 text-ocean-200 hover:text-white hover:border-pulse-cyan text-[11px] font-medium flex items-center justify-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            Reverse Course
          </button>
        </div>
      </div>

      {/* Fisherman Phone HUD Preview */}
      <div className="space-y-2 border-t border-ocean-700 pt-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-ocean-200">Fisherman Onboard View</h4>
          <select
            value={activeLang}
            onChange={(e) => setActiveLang(e.target.value as SupportedLanguage)}
            className="bg-ocean-950 border border-ocean-700 rounded px-1.5 py-0.5 text-[10px] text-ocean-200 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="ml">മലയാളം</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        {/* Mock Phone Display */}
        <div
          className={`p-3 rounded-xl border-2 text-center transition-all ${
            advice === 'DANGER'
              ? 'border-pulse-critical bg-rose-950/30'
              : advice === 'CAUTION'
              ? 'border-pulse-medium bg-amber-950/25'
              : 'border-pulse-safe bg-emerald-950/20'
          }`}
        >
          {v.commState === 'lost' && (
            <div className="mb-2 py-0.5 px-2 rounded bg-rose-950 text-rose-300 border border-rose-700 text-[10px] font-bold">
              NO SIGNAL — Retaining last broadcast received
            </div>
          )}
          <span
            className={`text-xl font-black tracking-wide ${
              advice === 'DANGER'
                ? 'text-rose-400'
                : advice === 'CAUTION'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {advice}
          </span>
          <p className="text-xs text-white font-medium my-1">{lang.advice[advice]}</p>

          {a?.recommendedCompass && advice !== 'SAFE' && (
            <div className="my-1.5 flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-sm">
              <span
                className="inline-block transform"
                style={{ transform: `rotate(${(a.safeBearingDeg || 0) - 90}deg)` }}
              >
                ➤
              </span>
              <span>Steer towards {a.recommendedCompass} ({Math.round(a.safeBearingDeg || 0)}°)</span>
            </div>
          )}

          <p className="text-[10px] text-ocean-400 mt-1">
            {v.commState === 'lost'
              ? `Last updated ${Math.round(v.lastContactMinAgo)}m ago`
              : 'Delivered just now via Coast Guard broadcast'}
          </p>
        </div>

        {/* Speak Warning Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeak}
            className="flex-1 py-1.5 rounded-lg bg-ocean-800 hover:bg-ocean-700 border border-ocean-600 text-pulse-cyan text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Synthesize Audio Warning ({lang.name})
          </button>
        </div>
        {speechNotice && (
          <p className="text-[10px] text-emerald-400 text-center animate-fade-in">{speechNotice}</p>
        )}
      </div>
    </div>
  );
};
