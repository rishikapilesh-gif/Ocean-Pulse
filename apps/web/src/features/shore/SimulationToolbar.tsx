import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Wind,
  Navigation,
  Sliders,
  Plus,
  Minus,
  Maximize2,
  Compass,
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

  const currentRadius = Math.round(storm?.radiusKm || 13);
  const currentSpeed = Math.round(storm?.speedKmh || 18);
  const currentBearing = Math.round(storm?.bearingDeg || 270);

  return (
    <div className="bg-ocean-950/95 backdrop-blur-md border-t border-ocean-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none z-20 shadow-[0_-4px_20px_rgba(2,8,19,0.8)]">
      {/* 1. Play/Pause & Speed */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md ${
            simulation?.running
              ? 'bg-pulse-medium hover:bg-amber-400 text-ocean-950 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-pulse-safe hover:bg-emerald-400 text-white shadow-[0_0_14px_rgba(16,185,129,0.4)]'
          }`}
          title={simulation?.running ? 'Pause Fleet Movement' : 'Resume Fleet Movement'}
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
            <option value="1" className="bg-ocean-900 text-white">1.0× (Normal)</option>
            <option value="2" className="bg-ocean-900 text-white">2.0× (Fast)</option>
            <option value="4" className="bg-ocean-900 text-white">4.0× (Rush)</option>
          </select>
        </div>

        <button
          onClick={resetScenario}
          className="px-2.5 py-1.5 rounded-lg bg-ocean-900/80 hover:bg-ocean-800 text-ocean-200 border border-ocean-750 flex items-center gap-1.5 transition-all hover:text-white"
          title="Reset to scenario defaults"
        >
          <RotateCcw className="w-3 h-3 text-ocean-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* 2. Direct Storm Quick Adjustments (Radius & Speed) */}
      {storm && (
        <div className="flex items-center gap-3 bg-ocean-900/90 border border-purple-500/40 rounded-xl px-3 py-1 text-xs shadow-inner">
          {/* Storm Radius Controller */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-purple-300 font-bold flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-purple-400" />
              Radius:
            </span>
            <button
              onClick={() => handleStormChange({ radiusKm: Math.max(5, currentRadius - 2) })}
              className="w-5 h-5 rounded bg-ocean-800 hover:bg-purple-900/80 border border-purple-500/50 text-white font-black flex items-center justify-center transition-colors"
              title="Decrease storm radius by 2 km"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-black text-white px-1 text-[11px] min-w-[36px] text-center">
              {currentRadius} km
            </span>
            <button
              onClick={() => handleStormChange({ radiusKm: Math.min(35, currentRadius + 2) })}
              className="w-5 h-5 rounded bg-ocean-800 hover:bg-purple-900/80 border border-purple-500/50 text-white font-black flex items-center justify-center transition-colors"
              title="Increase storm radius by 2 km"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <span className="text-ocean-700">|</span>

          {/* Storm Speed Controller */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" />
              Storm Speed:
            </span>
            <button
              onClick={() => handleStormChange({ speedKmh: Math.max(0, currentSpeed - 4) })}
              className="w-5 h-5 rounded bg-ocean-800 hover:bg-cyan-900/80 border border-cyan-500/50 text-white font-black flex items-center justify-center transition-colors"
              title="Slow storm down by 4 km/h"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-black text-white px-1 text-[11px] min-w-[50px] text-center">
              {currentSpeed} km/h
            </span>
            <button
              onClick={() => handleStormChange({ speedKmh: Math.min(50, currentSpeed + 4) })}
              className="w-5 h-5 rounded bg-ocean-800 hover:bg-cyan-900/80 border border-cyan-500/50 text-white font-black flex items-center justify-center transition-colors"
              title="Accelerate storm by 4 km/h"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Scenario Selector & Evasion Advice */}
      <div className="flex items-center gap-2">
        <select
          value={simulation?.scenarioId || 'scenario-1'}
          onChange={(e) => loadScenario(e.target.value)}
          className="bg-ocean-900/90 border border-ocean-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-pulse-cyan cursor-pointer max-w-[240px] truncate shadow-inner"
        >
          <option value="scenario-1">1. Approaching Storm Cell</option>
          <option value="scenario-2">2. Propulsion Breakdown</option>
          <option value="scenario-3">3. Communication Loss</option>
          <option value="scenario-4">4. Multiple SOS Alerts</option>
          <option value="scenario-5">5. Offline HUD Sync</option>
        </select>

        <label className="flex items-center gap-1.5 text-ocean-200 font-medium text-xs cursor-pointer px-2 py-1 rounded-md bg-ocean-900/50 border border-ocean-800 hover:border-ocean-600 transition-colors">
          <input
            type="checkbox"
            checked={simulation?.fishermenFollowAdvice || false}
            onChange={(e) => handleFollowAdviceChange(e.target.checked)}
            className="rounded bg-ocean-950 border-ocean-600 text-pulse-cyan focus:ring-0 cursor-pointer"
          />
          <span className="text-[11px] text-ocean-200 hidden sm:inline">Follow Evasion</span>
        </label>
      </div>

      {/* 4. Detailed What-If Cyclone Drawer Toggle */}
      <div className="relative">
        <button
          onClick={() => setStormDrawerOpen(!stormDrawerOpen)}
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-semibold ${
            stormDrawerOpen
              ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              : 'bg-ocean-900/80 border-ocean-750 text-ocean-200 hover:text-white hover:border-ocean-600'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>More Storm Sliders</span>
        </button>

        {stormDrawerOpen && storm && (
          <div className="absolute right-0 bottom-full mb-2 w-84 bg-ocean-950/95 backdrop-blur-xl border border-purple-500/60 rounded-xl p-4 shadow-2xl space-y-3.5 z-50 text-ocean-100">
            <h4 className="font-bold text-xs text-white flex items-center justify-between border-b border-ocean-800 pb-2">
              <span className="text-pulse-cyan font-bold flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-purple-400" />
                Live Cyclone Adjuster
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-200">
                Predictive Model
              </span>
            </h4>

            {/* Storm Radius Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-ocean-300 mb-1">
                <span className="font-semibold text-white">Storm Radius (Coverage):</span>
                <span className="text-purple-300 font-black">{currentRadius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={currentRadius}
                onChange={(e) => handleStormChange({ radiusKm: parseInt(e.target.value, 10) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between gap-1 mt-1">
                {[8, 14, 20, 28].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleStormChange({ radiusKm: r })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      currentRadius === r
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-ocean-900 border-ocean-700 text-ocean-300 hover:text-white'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Storm Speed Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-ocean-300 mb-1">
                <span className="font-semibold text-white">Forward Speed:</span>
                <span className="text-cyan-300 font-black">{currentSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={currentSpeed}
                onChange={(e) => handleStormChange({ speedKmh: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between gap-1 mt-1">
                {[0, 10, 18, 32].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStormChange({ speedKmh: s })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      currentSpeed === s
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-ocean-900 border-ocean-700 text-ocean-300 hover:text-white'
                    }`}
                  >
                    {s === 0 ? 'Stationary' : `${s} km/h`}
                  </button>
                ))}
              </div>
            </div>

            {/* Storm Direction Bearing */}
            <div>
              <div className="flex justify-between text-[11px] text-ocean-300 mb-1">
                <span className="font-semibold text-white">Track Direction (Bearing):</span>
                <span className="text-emerald-300 font-black">{currentBearing}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="5"
                value={currentBearing}
                onChange={(e) => handleStormChange({ bearingDeg: parseInt(e.target.value, 10) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between gap-1 mt-1">
                <button
                  onClick={() => handleStormChange({ bearingDeg: 270 })}
                  className="px-2 py-0.5 rounded text-[10px] bg-ocean-900 border border-ocean-700 text-ocean-200 hover:text-white"
                >
                  West (270°)
                </button>
                <button
                  onClick={() => handleStormChange({ bearingDeg: 0 })}
                  className="px-2 py-0.5 rounded text-[10px] bg-ocean-900 border border-ocean-700 text-ocean-200 hover:text-white"
                >
                  North (0°)
                </button>
                <button
                  onClick={() => handleStormChange({ bearingDeg: 180 })}
                  className="px-2 py-0.5 rounded text-[10px] bg-ocean-900 border border-ocean-700 text-ocean-200 hover:text-white"
                >
                  South (180°)
                </button>
                <button
                  onClick={() => handleStormChange({ bearingDeg: 90 })}
                  className="px-2 py-0.5 rounded text-[10px] bg-ocean-900 border border-ocean-700 text-ocean-200 hover:text-white"
                >
                  East (90°)
                </button>
              </div>
            </div>

            <p className="text-[10px] text-ocean-400 italic pt-1 border-t border-ocean-800">
              💡 Tip: You can also drag the cyclone directly anywhere across the ocean map.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
