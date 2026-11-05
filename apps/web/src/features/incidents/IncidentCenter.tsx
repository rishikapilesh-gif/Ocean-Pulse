import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { useAuth } from '../../context/AuthContext';
import { IncidentRecord } from '@ocean-pulse/shared';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Send,
  UserCheck,
  FileText,
  ExternalLink,
  Check,
} from 'lucide-react';

export const IncidentCenter: React.FC = () => {
  const { incidents, acknowledgeIncident, escalateIncident, resolveIncident, setSelectedVesselId } = useFleet();
  const { isOperator, user } = useAuth();

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [escalateAgency, setEscalateAgency] = useState('Indian Coast Guard MRCC (Kochi)');
  const [escalateReason, setEscalateReason] = useState('Immediate sea rescue and evacuation required');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const activeIncidents = incidents.filter((i) => i.status !== 'CLOSED');

  return (
    <div className="flex flex-col h-full bg-ocean-950 text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-ocean-700 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-pulse-critical" />
            <span>Incident & Distress Triage</span>
            <span className="text-xs font-normal text-ocean-300">({activeIncidents.length} active)</span>
          </h3>
          <p className="text-[11px] text-ocean-300">
            Persistent incident log with multi-operator acknowledgment & external MRCC escalation
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Incident Queue List */}
        <div className="w-1/2 border-r border-ocean-800 overflow-y-auto divide-y divide-ocean-800">
          {activeIncidents.length === 0 ? (
            <div className="p-8 text-center text-ocean-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="font-medium text-white">No active distress incidents</p>
              <p className="text-[11px] mt-1 text-ocean-300">All fishing fleet units are currently safe or nominal.</p>
            </div>
          ) : (
            activeIncidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isCritical = inc.priority === 'CRITICAL';

              return (
                <div
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setSelectedVesselId(inc.vesselId);
                  }}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-ocean-800' : 'hover:bg-ocean-900'
                  } ${inc.status === 'RECEIVED' ? 'border-l-4 border-l-pulse-critical bg-rose-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-pulse-critical animate-pulse" />}
                      {inc.vesselId} — {inc.vesselName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        inc.status === 'RECEIVED'
                          ? 'bg-pulse-critical text-white animate-pulse'
                          : inc.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-500 text-ocean-950 font-bold'
                          : inc.status === 'ACTION_IN_PROGRESS'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-emerald-600 text-white font-bold'
                      }`}
                    >
                      {inc.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-ocean-200 font-medium mt-1">
                    {inc.type.replace(/_/g, ' ')}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-ocean-400 mt-1.5 font-mono">
                    <span>Recv: {new Date(inc.serverReceivedAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span>Lat: {inc.reportedLat.toFixed(3)}, Lng: {inc.reportedLng.toFixed(3)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Detail / Action Pane */}
        <div className="w-1/2 p-3 overflow-y-auto space-y-3">
          {selectedIncident ? (
            <>
              <div className="border-b border-ocean-700 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-ocean-400">ID: {selectedIncident.id}</span>
                  <span className="font-bold text-pulse-cyan text-xs">
                    {selectedIncident.vesselId} ({selectedIncident.vesselName})
                  </span>
                </div>
                <h4 className="font-bold text-base text-white mt-1">
                  {selectedIncident.type.replace(/_/g, ' ')}
                </h4>
              </div>

              {/* Status Progression Bar */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-ocean-300 uppercase tracking-wider">
                  Incident Safety Progression
                </span>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-medium">
                  <div
                    className={`p-1 rounded ${
                      selectedIncident.status === 'RECEIVED'
                        ? 'bg-pulse-critical text-white font-bold'
                        : 'bg-ocean-800 text-ocean-300'
                    }`}
                  >
                    1. Received
                  </div>
                  <div
                    className={`p-1 rounded ${
                      selectedIncident.status === 'ACKNOWLEDGED'
                        ? 'bg-pulse-medium text-ocean-950 font-bold'
                        : selectedIncident.acknowledgedAt
                        ? 'bg-emerald-900/60 text-emerald-300'
                        : 'bg-ocean-800 text-ocean-400'
                    }`}
                  >
                    2. Acknowledged
                  </div>
                  <div
                    className={`p-1 rounded ${
                      selectedIncident.status === 'ACTION_IN_PROGRESS'
                        ? 'bg-purple-600 text-white font-bold'
                        : selectedIncident.escalatedToExternalAgencyAt
                        ? 'bg-purple-900/60 text-purple-200'
                        : 'bg-ocean-800 text-ocean-400'
                    }`}
                  >
                    3. MRCC Action
                  </div>
                  <div
                    className={`p-1 rounded ${
                      selectedIncident.status === 'RESOLVED'
                        ? 'bg-pulse-safe text-white font-bold'
                        : 'bg-ocean-800 text-ocean-400'
                    }`}
                  >
                    4. Resolved
                  </div>
                </div>
              </div>

              {/* Timestamps Card */}
              <div className="bg-ocean-900 border border-ocean-800 p-2.5 rounded-lg space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-ocean-400">Client Submission:</span>
                  <span className="text-white">{new Date(selectedIncident.clientSubmittedAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ocean-400">Server Commitment:</span>
                  <span className="text-white">{new Date(selectedIncident.serverReceivedAt).toLocaleTimeString()}</span>
                </div>
                {selectedIncident.acknowledgedAt && (
                  <div className="flex justify-between text-amber-300">
                    <span>Operator Acknowledged:</span>
                    <span>{new Date(selectedIncident.acknowledgedAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {selectedIncident.escalatedToExternalAgencyAt && (
                  <div className="flex justify-between text-purple-300">
                    <span>Escalated to Coast Guard:</span>
                    <span>{new Date(selectedIncident.escalatedToExternalAgencyAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {selectedIncident.resolvedAt && (
                  <div className="flex justify-between text-emerald-300">
                    <span>Resolved At:</span>
                    <span>{new Date(selectedIncident.resolvedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Operator Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-ocean-300 uppercase tracking-wider">
                  Operator Actions
                </span>
                <div className="flex flex-col gap-1.5">
                  {selectedIncident.status === 'RECEIVED' && (
                    <button
                      onClick={() => acknowledgeIncident(selectedIncident.id, 'Acknowledged by Shore Safety Operator')}
                      className="w-full py-2 rounded-lg bg-pulse-medium hover:bg-amber-400 text-ocean-950 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-pulse-medium/20 text-xs"
                    >
                      <Check className="w-4 h-4" />
                      Acknowledge Distress Immediately
                    </button>
                  )}

                  {selectedIncident.status !== 'RESOLVED' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setEscalateModalOpen(true)}
                        className="py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-500 text-purple-200 font-semibold flex items-center justify-center gap-1 transition-colors text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Escalate to MRCC
                      </button>

                      <button
                        onClick={() => setResolveModalOpen(true)}
                        className="py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500 text-emerald-200 font-semibold flex items-center justify-center gap-1 transition-colors text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve Incident
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution or Operator Notes */}
              {selectedIncident.resolutionNotes && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-700/60 text-emerald-200">
                  <strong className="block text-[10px] text-emerald-400 uppercase">Resolution Report:</strong>
                  {selectedIncident.resolutionNotes}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-ocean-400">
              <FileText className="w-6 h-6 mx-auto mb-1 text-ocean-600" />
              Select an incident from the queue to view full audit timestamps and execute actions.
            </div>
          )}
        </div>
      </div>

      {/* Escalate Modal */}
      {escalateModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ocean-900 border border-ocean-600 rounded-xl p-4 max-w-md w-full space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-purple-400" />
              Escalate Distress to External Response Authority
            </h4>
            <div>
              <label className="text-[11px] text-ocean-300 block mb-1">Target Authority</label>
              <input
                type="text"
                value={escalateAgency}
                onChange={(e) => setEscalateAgency(e.target.value)}
                className="w-full bg-ocean-950 border border-ocean-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-ocean-300 block mb-1">Escalation Justification</label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                className="w-full bg-ocean-950 border border-ocean-700 rounded px-2.5 py-1.5 text-xs text-white h-20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEscalateModalOpen(false)}
                className="px-3 py-1.5 rounded border border-ocean-700 text-ocean-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await escalateIncident(selectedIncident.id, escalateAgency, escalateReason);
                  setEscalateModalOpen(false);
                }}
                className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ocean-900 border border-ocean-600 rounded-xl p-4 max-w-md w-full space-y-3">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Document Incident Resolution
            </h4>
            <p className="text-[11px] text-ocean-300">
              Provide verifiable outcome notes before closing active emergency monitoring for {selectedIncident.vesselId}.
            </p>
            <textarea
              placeholder="e.g., Vessel escorted back to harbor by patrol boat; all 6 crew safe and accounted for."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-ocean-950 border border-ocean-700 rounded px-2.5 py-1.5 text-xs text-white h-24"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-3 py-1.5 rounded border border-ocean-700 text-ocean-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={resolutionNotes.trim().length < 5}
                onClick={async () => {
                  await resolveIncident(selectedIncident.id, resolutionNotes);
                  setResolveModalOpen(false);
                  setResolutionNotes('');
                }}
                className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-40"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
