import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { api } from '../../services/api';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Wind,
  Navigation,
  Sliders,
} from 'lucide-react';

export const SimulationToolbar: React.FC = () => {
  const { simulation, storm, togglePlay, setSpeed, setFollowAdvice, updateStorm, loadScenario, resetScenario } = useFleet();
  const [stormDrawerOpen, setStormDrawerOpen] = useState(false);

  const handleFollowAdviceChange = async (checked: boolean) => {
    await setFollowAdvice(checked);
  };

  const handleStormChange = async (params: any) => {
    await updateStorm(params);
  };

  return (
    <div className="bg-ocean-950/95 backdrop-blur-md border-t border-ocean-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs select-none z-20 shadow-[0_-4px_20px_rgba(2,8,19,0.8)]">
      {/* Play/Pause & Speed */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all ${
            simulation?.running
              ? 'bg-pulse-medium hover:bg-amber-400 text-ocean-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-pulse-safe hover:bg-emerald-400 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)]'
          }`}
        >
          {simulation?.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{simulation?.running ? 'Pause Sim' : 'Resume Sim'}</span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ocean-900/80 border border-ocean-750">
          <FastForward className="w-3 h-3 text-pulse-cyan" />
          <span className="text-[11px] text-ocean-300 font-medium">Speed:</span>
          <select
            value={simulation?.speedMultiplier || 1}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value="0.5" className="bg-ocean-900 text-white">0.5×</option>
            <option value="1" className="bg-ocean-900 text-white">1.0× (Realtime)</option>
            <option value="2" className="bg-ocean-900 text-white">2.0×</option>
            <option value="4" className="bg-ocean-900 text-white">4.0×</option>
          </select>
        </div>

        <button
          onClick={resetScenario}
          className="px-2.5 py-1.5 rounded-lg bg-ocean-900/80 hover:bg-ocean-800 text-ocean-200 border border-ocean-750 flex items-center gap-1.5 transition-all hover:text-white"
        >
          <RotateCcw className="w-3 h-3 text-ocean-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* Scenario Selector */}
      <div className="flex items-center gap-2">
        <span className="text-ocean-300 font-medium text-xs hidden md:inline">Tactical Scenario:</span>
        <select
          value={simulation?.scenarioId || 'scenario-1'}
          onChange={(e) => loadScenario(e.target.value)}
          className="bg-ocean-900/90 border border-ocean-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-pulse-cyan cursor-pointer max-w-[300px] truncate shadow-inner"
        >
          <option value="scenario-1">1. Approaching Storm (Collision Course)</option>
          <option value="scenario-2">2. Propulsion Breakdown & Reef Drift</option>
          <option value="scenario-3">3. Communication Loss & Stale Telemetry</option>
          <option value="scenario-4">4. Multiple Concurrent SOS Alerts</option>
          <option value="scenario-5">5. Offline HUD Reconnection & Sync</option>
        </select>

        <label className="flex items-center gap-2 text-ocean-200 font-medium text-xs cursor-pointer ml-2 px-2.5 py-1 rounded-md bg-ocean-900/50 border border-ocean-800">
          <input
            type="checkbox"
            checked={simulation?.fishermenFollowAdvice || false}
            onChange={(e) => handleFollowAdviceChange(e.target.checked)}
            className="rounded bg-ocean-950 border-ocean-600 text-pulse-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-[11px] text-ocean-200">Vessels Follow Advisory</span>
        </label>
      </div>

      {/* Storm What-If Drawer Button */}
      <div className="relative">
        <button
          onClick={() => setStormDrawerOpen(!stormDrawerOpen)}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-semibold ${
            stormDrawerOpen
              ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              : 'bg-ocean-900/80 border-ocean-750 text-ocean-200 hover:text-white hover:border-ocean-600'
          }`}
        >
          <Wind className="w-3.5 h-3.5 text-purple-400" />
          <span>What-If Storm</span>
        </button>

        {stormDrawerOpen && storm && (
          <div className="absolute right-0 bottom-full mb-2 w-80 bg-ocean-950/95 backdrop-blur-xl border border-ocean-600 rounded-xl p-3.5 shadow-2xl space-y-3 z-50 text-ocean-100">
            <h4 className="font-bold text-xs text-white flex items-center justify-between border-b border-ocean-800 pb-2">
              <span className="text-pulse-cyan font-bold">Simulate Cyclone Parameters</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-ocean-800 border border-ocean-700 text-ocean-300">Predictive</span>
            </h4>

            <div>
              <div className="flex justify-between text-[11px] text-ocean-300 mb-1">
                <span>Moving Direction (Bearing):</span>
                <span className="text-white font-bold">{Math.round(storm.bearingDeg)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={storm.bearingDeg}
                onChange={(e) => handleStormChange({ bearingDeg: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between gap-1 mt-1">
                <button
                  onClick={() => handleStormChange({ bearingDeg: 270 })}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-ocean-800 border border-ocean-700 text-ocean-200"
                >
                  West (270°)
                </button>
                <button
                  onClick={() => handleStormChange({ bearingDeg: 0 })}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-ocean-800 border border-ocean-700 text-ocean-200"
                >
                  North (0°)
                </button>
                <button
                  onClick={() => handleStormChange({ bearingDeg: 180 })}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-ocean-800 border border-ocean-700 text-ocean-200"
                >
                  South (180°)
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-ocean-300 mb-1">
                <span>Storm Speed:</span>
                <span className="text-white font-bold">{Math.round(storm.speedKmh)} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={storm.speedKmh}
                onChange={(e) => handleStormChange({ speedKmh: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-ocean-300 mb-1">
                <span>Radius (Coverage):</span>
                <span className="text-white font-bold">{Math.round(storm.radiusKm)} km</span>
              </div>
              <input
                type="range"
                min="6"
                max="25"
                value={storm.radiusKm}
                onChange={(e) => handleStormChange({ radiusKm: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500"
              />
            </div>

            <p className="text-[10px] text-ocean-400 italic">
              Tip: You can also drag the storm cell directly on the map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
