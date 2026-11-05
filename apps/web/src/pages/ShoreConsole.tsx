import React, { useState } from 'react';
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
} from 'lucide-react';

export const ShoreConsole: React.FC = () => {
  const { incidents, requests } = useFleet();
  const [activeTab, setActiveTab] = useState<'fleet' | 'incidents' | 'assistance' | 'ai'>('fleet');

  const activeSOSCount = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.priority === 'CRITICAL'
  ).length;

  const pendingRequestsCount = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'ACKNOWLEDGED'
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] bg-ocean-950 overflow-hidden">
      {/* Simulation Controls Strip */}
      <SimulationToolbar />

      {/* Main Command Center Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Digital Ocean Twin Geographic Map */}
        <div className="flex-1 h-full relative">
          <OceanMap />
        </div>

        {/* Right: Operational Panels (Fleet, Incidents, Assistance, AI Copilot) */}
        <div className="w-[440px] xl:w-[480px] h-full flex flex-col bg-ocean-900 border-l border-ocean-700 shadow-2xl z-10">
          {/* Panel Selector Tabs */}
          <div className="flex items-center bg-ocean-950 border-b border-ocean-700 px-2 pt-2 gap-1 select-none text-xs">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'fleet'
                  ? 'border-pulse-cyan text-pulse-cyan bg-ocean-900/60'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Fleet
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'incidents'
                  ? 'border-pulse-critical text-pulse-critical bg-ocean-900/60'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Distress
              {activeSOSCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-pulse-critical text-white text-[10px] flex items-center justify-center font-black animate-pulse">
                  {activeSOSCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('assistance')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'assistance'
                  ? 'border-amber-400 text-amber-300 bg-ocean-900/60'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              Logistics
              {pendingRequestsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-ocean-950 text-[10px] flex items-center justify-center font-black">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'ai'
                  ? 'border-pulse-cyan text-pulse-cyan bg-ocean-900/60'
                  : 'border-transparent text-ocean-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Copilot
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'fleet' && (
              <div className="flex flex-col h-full divide-y divide-ocean-700">
                <div className="h-[48%] overflow-hidden">
                  <FleetList />
                </div>
                <div className="h-[52%] overflow-hidden">
                  <VesselDetailPanel />
                </div>
              </div>
            )}

            {activeTab === 'incidents' && <IncidentCenter />}

            {activeTab === 'assistance' && <AssistanceCoordinator />}

            {activeTab === 'ai' && <AICopilotPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};
