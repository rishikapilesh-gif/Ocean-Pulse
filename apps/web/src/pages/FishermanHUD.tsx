import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFleet } from '../context/FleetContext';
import { api } from '../services/api';
import { offlineQueue } from '../services/offlineQueue';
import { SOSButton } from '../features/fisherman/SOSButton';
import { AssistanceModal } from '../features/fisherman/AssistanceModal';
import {
  TRANSLATIONS,
  SupportedLanguage,
  IncidentType,
  AssistanceCategory,
} from '@ocean-pulse/shared';
import {
  Radio,
  Wifi,
  WifiOff,
  Compass,
  Volume2,
  LifeBuoy,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RotateCw,
  Info,
  Navigation,
} from 'lucide-react';

export const FishermanHUD: React.FC = () => {
  const { user } = useAuth();
  const { vessels, incidents, refreshState, createSOS, createAssistanceRequest, updateWhatIf } = useFleet();

  const [activeLang, setActiveLang] = useState<SupportedLanguage>('ml'); // Default to Malayalam for local Kerala fishing fleet
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<{ sosCount: number; reqCount: number }>({
    sosCount: 0,
    reqCount: 0,
  });
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFeedback, setDeliveryFeedback] = useState<string>('');
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // Identify vessel for this HUD (defaults to B01 Sagar Kanya)
  const vesselId = user?.assignedVesselId || 'B01';
  const vessel = vessels.find((v) => v.id === vesselId) || vessels[0];

  // Check network connectivity and offline queue
  const updatePending = useCallback(async () => {
    const counts = await offlineQueue.getPendingCount();
    setPendingCount(counts);
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('[HUD] Network reconnected; reconciling offline queue...');
      const res = await offlineQueue.syncAllPending();
      if (res.syncedSOS > 0 || res.syncedRequests > 0) {
        setDeliveryFeedback(`Synced ${res.syncedSOS} emergency and ${res.syncedRequests} assistance alerts.`);
        await refreshState();
      }
      await updatePending();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updatePending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshState, updatePending]);

  // Find latest active incident for this vessel
  const latestIncident = incidents
    .filter((i) => i.vesselId === vessel?.id)
    .sort((a, b) => new Date(b.clientSubmittedAt).getTime() - new Date(a.clientSubmittedAt).getTime())[0];

  const rawAdvice = vessel?.lastDeliveredWarning?.level || (vessel?.assessment?.level === 'Critical' ? 'DANGER' : vessel?.assessment?.level === 'High' || vessel?.assessment?.level === 'Medium' ? 'CAUTION' : 'SAFE');
  const advice: 'SAFE' | 'CAUTION' | 'DANGER' = rawAdvice === 'DANGER' ? 'DANGER' : rawAdvice === 'CAUTION' ? 'CAUTION' : 'SAFE';
  const lang = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  // Speech synthesizer
  const speakWarning = () => {
    if (!('speechSynthesis' in window)) return;
    const text = lang?.advice?.[advice] || 'Safe conditions. Continue journey carefully.';
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang?.code || 'en-IN';
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // Trigger SOS with Idempotency Key
  const handleTriggerSOS = async (type: IncidentType, notes?: string) => {
    if (!vessel) return;
    setIsSubmitting(true);
    const idempotencyKey = `sos-${vessel.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const payload = {
      vesselId: vessel.id,
      type,
      lat: vessel.lat,
      lng: vessel.lng,
      gpsAccuracyMeters: 4.5,
      idempotencyKey,
      clientSubmittedAt: new Date().toISOString(),
      notes,
    };

    // Immediate local creation so UI and Shore Console update in real-time
    await createSOS(payload);
    setDeliveryFeedback('EMERGENCY SOS TRANSMITTED to Shore Command & Coastal SAR.');

    try {
      if (navigator.onLine && vessel.commState !== 'lost') {
        await api.submitSOS(payload);
      } else {
        await offlineQueue.queueSOS(payload);
      }
    } catch (err: any) {
      await offlineQueue.queueSOS(payload);
    }

    await updatePending();
    setIsSubmitting(false);
  };

  // Trigger Assistance Request
  const handleAssistanceSubmit = async (data: { category: AssistanceCategory; details: string; urgency: string }) => {
    if (!vessel) return;
    setIsSubmitting(true);
    const idempotencyKey = `req-${vessel.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const payload = {
      vesselId: vessel.id,
      category: data.category,
      quantityOrDetails: data.details,
      urgency: data.urgency as any,
      lat: vessel.lat,
      lng: vessel.lng,
      idempotencyKey,
    };

    // Immediate local creation
    await createAssistanceRequest(payload);
    setDeliveryFeedback('Assistance request recorded and routed to Shore Logistics.');

    try {
      if (navigator.onLine && vessel.commState !== 'lost') {
        await api.createAssistanceRequest(payload);
      } else {
        await offlineQueue.queueAssistanceRequest(payload);
      }
    } catch (err) {
      await offlineQueue.queueAssistanceRequest(payload);
    }

    await updatePending();
    setIsSubmitting(false);
  };

  const handleAcknowledgeWarning = async () => {
    if (!vessel) return;
    await updateWhatIf(vessel.id, {
      lastDeliveredWarning: {
        ...(vessel.lastDeliveredWarning || { level: 'SAFE', safeBearingDeg: 270, issuedAtIso: new Date().toISOString(), acknowledgedByFisher: true }),
        acknowledgedByFisher: true,
        acknowledgedAtIso: new Date().toISOString(),
      },
    });
    try {
      await api.acknowledgeWarning(vessel.id);
    } catch (e) {
      // handled locally
    }
  };

  if (!vessel) {
    return <div className="p-8 text-center text-white">Loading Fisherman HUD...</div>;
  }

  const isDisconnected = !isOnline || vessel.commState === 'lost';

  return (
    <div className="min-h-screen bg-ocean-950 text-white flex flex-col justify-between max-w-lg mx-auto shadow-2xl border-x border-cyan-500/20 pb-6 relative">
      {/* Top Mobile Status Header */}
      <div className="bg-ocean-900/90 backdrop-blur-xl border-b border-ocean-700/80 p-3.5 space-y-2.5 select-none shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-2">
              <span>{vessel.name}</span>
              <span className="font-mono text-xs text-pulse-cyan bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {vessel.id}
              </span>
            </h1>
            <p className="text-[11px] text-ocean-300 mt-0.5">
              Master: <strong className="text-white font-semibold">{vessel.master}</strong> • {vessel.regNo}
            </p>
          </div>

          {/* Language Switcher */}
          <select
            value={activeLang}
            onChange={(e) => setActiveLang(e.target.value as SupportedLanguage)}
            className="bg-ocean-950 border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs text-pulse-cyan font-bold focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="ml">മലയാളം</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Network & Connection Status Pill */}
        {isDisconnected ? (
          <div className="py-2 px-3 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-glow-critical animate-pulse">
            <WifiOff className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="tracking-wide">NOT CONNECTED — SOS STORED IN DEVICE MEMORY</span>
              <p className="text-[10px] font-normal text-rose-300">
                Radio signal absent. Showing last cached broadcast. Offline queue active.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-1.5 px-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              CONNECTED TO SHORE SAFETY
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Signal: {vessel.commState.toUpperCase()}</span>
          </div>
        )}

        {/* Pending Queue Warning */}
        {(pendingCount.sosCount > 0 || pendingCount.reqCount > 0) && (
          <div className="py-1.5 px-3 rounded-xl bg-amber-950/90 border border-amber-500 text-amber-200 text-xs flex items-center justify-between shadow-glow-amber">
            <span>
              {pendingCount.sosCount} SOS and {pendingCount.reqCount} requests stored in offline device memory.
            </span>
            <span className="font-black text-amber-400 underline text-[10px] uppercase tracking-wider">Auto-Sync Active</span>
          </div>
        )}
      </div>

      {/* Main Advisory Display */}
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-center select-none">
        {/* Safety Level Big Tactical Card */}
        <div
          className={`p-6 rounded-3xl border-4 text-center transition-all shadow-2xl relative overflow-hidden ${
            advice === 'DANGER'
              ? 'border-pulse-critical bg-gradient-to-b from-rose-950/70 to-rose-900/40 text-rose-100 shadow-glow-critical'
              : advice === 'CAUTION'
              ? 'border-pulse-medium bg-gradient-to-b from-amber-950/60 to-amber-900/30 text-amber-100 shadow-glow-amber'
              : 'border-pulse-safe bg-gradient-to-b from-emerald-950/60 to-emerald-900/30 text-emerald-100 shadow-glow-safe'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className={`text-5xl font-black tracking-widest ${
                advice === 'DANGER'
                  ? 'text-pulse-critical text-glow-critical'
                  : advice === 'CAUTION'
                  ? 'text-pulse-medium'
                  : 'text-pulse-safe text-glow-safe'
              }`}
            >
              {advice}
            </span>
          </div>

          <p className="text-base md:text-lg font-bold text-white leading-snug my-2.5">
            {lang.advice[advice]}
          </p>

          {/* Evasive Bearing Indicator */}
          {vessel.assessment?.recommendedCompass && advice !== 'SAFE' && (
            <div className="my-3.5 py-2.5 px-4 rounded-2xl bg-ocean-950/90 border border-emerald-400/50 flex items-center justify-center gap-2.5 text-emerald-300 font-black text-base shadow-lg shadow-emerald-950/50">
              <span
                className="text-2xl transform transition-transform"
                style={{ transform: `rotate(${(vessel.assessment.safeBearingDeg || 0) - 90}deg)` }}
              >
                ➤
              </span>
              <span>
                Steer towards {vessel.assessment.recommendedCompass} ({Math.round(vessel.assessment.safeBearingDeg || 0)}°)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-ocean-300 pt-2.5 border-t border-white/10 font-medium">
            <span>Speed: <strong className="text-white">{Math.round(vessel.effectiveSpeedKmh)} km/h</strong></span>
            <span>Course: <strong className="text-white">{Math.round(vessel.bearingDeg)}°</strong></span>
            <span>Confidence: <strong className="text-white">{vessel.assessment?.confidence ?? 0}%</strong></span>
          </div>

          {/* Warning Audio & Ack */}
          <div className="flex gap-2.5 mt-3.5">
            <button
              onClick={speakWarning}
              className="flex-1 py-2.5 rounded-xl bg-ocean-800/90 hover:bg-ocean-700 text-pulse-cyan text-xs font-bold flex items-center justify-center gap-2 border border-cyan-500/30 transition-all shadow-sm hover:shadow-cyan-500/20"
            >
              <Volume2 className="w-4 h-4" />
              Speak Warning ({lang.name})
            </button>

            {!vessel.lastDeliveredWarning.acknowledgedByFisher && (
              <button
                onClick={handleAcknowledgeWarning}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/40"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>

        {/* Transmission Progression Tracker for Active Incident */}
        {latestIncident && latestIncident.status !== 'CLOSED' && (
          <div className="bg-ocean-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-pulse-critical" />
                Active Distress Transmission Status
              </span>
              <span className="font-mono text-[10px] text-pulse-cyan bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                {latestIncident.type.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center font-bold">
              <div
                className={`p-1.5 rounded-lg ${
                  latestIncident.status === 'RECEIVED'
                    ? 'bg-pulse-critical text-white shadow-glow-critical'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                ✓ Sent
              </div>
              <div
                className={`p-1.5 rounded-lg ${
                  latestIncident.status === 'ACKNOWLEDGED'
                    ? 'bg-pulse-medium text-ocean-950 shadow-glow-amber'
                    : latestIncident.acknowledgedAt
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : 'bg-ocean-950 text-ocean-500'
                }`}
              >
                {latestIncident.acknowledgedAt ? '✓ Operator Seen' : 'Waiting Op'}
              </div>
              <div
                className={`p-1.5 rounded-lg ${
                  latestIncident.status === 'ACTION_IN_PROGRESS'
                    ? 'bg-purple-600 text-white'
                    : latestIncident.escalatedToExternalAgencyAt
                    ? 'bg-purple-950 text-purple-200 border border-purple-700'
                    : 'bg-ocean-950 text-ocean-500'
                }`}
              >
                {latestIncident.escalatedToExternalAgencyAt ? '✓ MRCC Action' : 'MRCC Queue'}
              </div>
              <div
                className={`p-1.5 rounded-lg ${
                  latestIncident.status === 'RESOLVED'
                    ? 'bg-pulse-safe text-white shadow-glow-safe'
                    : 'bg-ocean-950 text-ocean-500'
                }`}
              >
                {latestIncident.status === 'RESOLVED' ? '✓ Resolved' : 'Active'}
              </div>
            </div>

            {latestIncident.acknowledgedAt && (
              <p className="text-[10px] text-emerald-300 italic text-center font-medium">
                Coast Guard Shore Operator acknowledged alert at{' '}
                {new Date(latestIncident.acknowledgedAt).toLocaleTimeString()}. Maintain position if safe.
              </p>
            )}
          </div>
        )}

        {/* Feedback alert toast */}
        {deliveryFeedback && (
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-pulse-cyan text-pulse-cyan text-xs text-center font-semibold animate-fade-in shadow-glow-cyan-sm">
            {deliveryFeedback}
          </div>
        )}

        {/* SOS Primary Trigger Control */}
        <SOSButton onTriggerSOS={handleTriggerSOS} isSubmitting={isSubmitting} />

        {/* Secondary Action: Request Assistance */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={() => setAssistanceModalOpen(true)}
            className="flex-1 py-3.5 rounded-2xl bg-ocean-850 hover:bg-ocean-800 border border-cyan-500/30 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:border-cyan-400"
          >
            <LifeBuoy className="w-4 h-4 text-pulse-cyan" />
            Request Supplies / Fuel / Water
          </button>
          <button
            onClick={() => setGuidelinesOpen(!guidelinesOpen)}
            className="px-3.5 py-3.5 rounded-2xl bg-ocean-900 border border-ocean-700 text-ocean-300 hover:text-white transition-colors"
            title="Offline Safety Guidelines"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Offline Safety Guidelines Drawer */}
        {guidelinesOpen && (
          <div className="p-3.5 rounded-2xl bg-ocean-900/90 backdrop-blur-md border border-ocean-700 text-xs text-ocean-200 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Standard Maritime Safety Procedures
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-ocean-300">
              <li>Wear life jackets (PFDs) before entering rough sea or cyclone outer bands.</li>
              <li>Switch VHF marine radio to Channel 16 (156.8 MHz) for emergency distress relay.</li>
              <li>If engine fails, deploy sea anchor to keep bow into oncoming waves and avoid broaching.</li>
              <li>A mobile phone SOS requires cellular network; never rely on it as a substitute for satellite DAT.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Assistance Modal */}
      <AssistanceModal
        isOpen={assistanceModalOpen}
        onClose={() => setAssistanceModalOpen(false)}
        onSubmit={handleAssistanceSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
