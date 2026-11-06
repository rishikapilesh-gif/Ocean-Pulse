import React from 'react';
import { useFleet } from '../../context/FleetContext';
import { api } from '../../services/api';
import { ASSISTANCE_CATEGORIES, REQUEST_STATUSES } from '@ocean-pulse/shared';
import {
  LifeBuoy,
  Droplet,
  Utensils,
  Fuel,
  Wrench,
  HeartPulse,
  Radio,
  CheckCircle,
  Truck,
} from 'lucide-react';

export const AssistanceCoordinator: React.FC = () => {
  const { requests, updateAssistanceStatus } = useFleet();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'DRINKING_WATER':
        return <Droplet className="w-3.5 h-3.5 text-cyan-400" />;
      case 'FOOD':
        return <Utensils className="w-3.5 h-3.5 text-amber-400" />;
      case 'FUEL':
        return <Fuel className="w-3.5 h-3.5 text-orange-400" />;
      case 'MECHANICAL':
        return <Wrench className="w-3.5 h-3.5 text-purple-400" />;
      case 'MEDICAL':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <LifeBuoy className="w-3.5 h-3.5 text-ocean-300" />;
    }
  };

  const handleUpdate = async (id: string, status: string) => {
    await updateAssistanceStatus(id, status, `Status updated to ${status} by Shore Operator`);
  };

  return (
    <div className="flex flex-col h-full bg-ocean-950 text-xs p-3 space-y-3 overflow-y-auto select-none">
      <div className="border-b border-ocean-700 pb-2">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-pulse-cyan" />
          <span>Assistance Coordination</span>
          <span className="text-xs font-normal text-ocean-300">({requests.length} total)</span>
        </h3>
        <p className="text-[11px] text-ocean-300">
          Non-distress resource requests (water, food, fuel, towing) requiring shore logistics
        </p>
      </div>

      <div className="space-y-2">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-ocean-400">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-400 opacity-60" />
            No open assistance requests. Fisher fleet supplies are currently adequate.
          </div>
        ) : (
          requests.map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-lg bg-ocean-900 border border-ocean-700 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(r.category)}
                  <span className="font-bold text-white text-xs">
                    {r.vesselId} — {r.vesselName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-ocean-800 text-pulse-cyan border border-ocean-600">
                    {r.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-600'
                      : r.status === 'DISPATCHED'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-600'
                      : r.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-600'
                      : 'bg-ocean-800 text-ocean-400'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <p className="text-ocean-100 bg-ocean-950/70 p-2 rounded border border-ocean-800">
                {r.quantityOrDetails}
              </p>

              <div className="flex items-center justify-between text-[10px] text-ocean-400 font-mono">
                <span>Requested: {new Date(r.createdAt).toLocaleTimeString()}</span>
                <span>Urgency: <strong className="text-white uppercase">{r.urgency}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-ocean-800">
                {r.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdate(r.id, REQUEST_STATUSES.ACKNOWLEDGED)}
                    className="px-2.5 py-1 rounded bg-ocean-800 hover:bg-ocean-700 text-pulse-cyan border border-ocean-600 font-semibold"
                  >
                    Acknowledge
                  </button>
                )}
                {r.status === 'ACKNOWLEDGED' && (
                  <button
                    onClick={() => handleUpdate(r.id, REQUEST_STATUSES.DISPATCHED)}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3" />
                    Dispatch Boat / Rations
                  </button>
                )}
                {r.status === 'DISPATCHED' && (
                  <button
                    onClick={() => handleUpdate(r.id, REQUEST_STATUSES.COMPLETED)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Confirm Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
