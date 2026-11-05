import React, { useState, useRef } from 'react';
import { IncidentType } from '@ocean-pulse/shared';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface SOSButtonProps {
  onTriggerSOS: (type: IncidentType, notes?: string) => Promise<void>;
  isSubmitting: boolean;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onTriggerSOS, isSubmitting }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<IncidentType>('MANUAL_SOS');
  const [notes, setNotes] = useState('');
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {
    if (isSubmitting) return;
    setHoldProgress(0);
    const stepTime = 25; // ms
    const totalTime = 2000; // 2 seconds hold
    const increment = (stepTime / totalTime) * 100;

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current!);
          setModalOpen(true);
          return 100;
        }
        return prev + increment;
      });
    }, stepTime);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const confirmSOS = async () => {
    await onTriggerSOS(selectedType, notes);
    setModalOpen(false);
    setHoldProgress(0);
    setNotes('');
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center py-3 select-none">
        <button
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          className="relative w-48 h-48 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 shadow-glow-critical flex flex-col items-center justify-center text-white active:scale-95 transition-all touch-none border-4 border-rose-400/60 group"
        >
          {/* Outer animated halo ring */}
          <div className="absolute -inset-2 rounded-full border border-rose-500/30 animate-ping pointer-events-none" />

          {/* Progress ring SVG */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="96"
              cy="96"
              r="86"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="9"
            />
            <circle
              cx="96"
              cy="96"
              r="86"
              fill="transparent"
              stroke="#ffffff"
              strokeWidth="9"
              strokeDasharray={2 * Math.PI * 86}
              strokeDashoffset={2 * Math.PI * 86 * (1 - holdProgress / 100)}
              strokeLinecap="round"
              className="sos-progress-ring"
            />
          </svg>

          <AlertTriangle className="w-13 h-13 text-white animate-pulse drop-shadow-md" />
          <span className="text-3xl font-black tracking-widest mt-1 text-glow-critical">S O S</span>
          <span className="text-[11px] uppercase font-black tracking-wider text-rose-100 opacity-95 mt-0.5">
            {holdProgress > 0 ? `HOLD ${Math.round(holdProgress)}%` : 'PRESS & HOLD (2S)'}
          </span>
        </button>

        <p className="text-[11px] text-ocean-300 text-center mt-3 max-w-xs font-medium">
          Press & hold for 2 seconds to initiate emergency distress transmission to Shore Command.
        </p>
      </div>

      {/* Emergency Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-ocean-950 border-2 border-pulse-critical rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-fade-in text-white shadow-rose-950/80">
            <div className="flex items-center justify-between border-b border-ocean-800 pb-2.5">
              <h3 className="font-black text-base text-pulse-critical flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                CONFIRM DISTRESS ALERT
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ocean-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ocean-200">
              Select emergency category (distress transmits immediately with current GPS fix):
            </p>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {[
                ['MANUAL_SOS', 'Immediate Danger / Life Threatening'],
                ['MEDICAL_EMERGENCY', 'Medical Emergency / Severe Injury'],
                ['CAPSIZE_OR_SINKING', 'Vessel Taking Water / Capsize Risk'],
                ['FIRE_OR_ENGINE', 'Fire Onboard / Engine Breakdown'],
                ['SEVERE_WEATHER', 'Caught in High Seas / Cyclonic Gale'],
                ['PERSON_OVERBOARD', 'Person Overboard'],
                ['OTHER', 'Other Emergency'],
              ].map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type as IncidentType)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedType === type
                      ? 'bg-pulse-critical text-white border-rose-400 shadow-md shadow-rose-900/40'
                      : 'bg-ocean-900/90 border-ocean-700 text-ocean-200 hover:border-ocean-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Short note or crew count (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-ocean-900 border border-ocean-700 rounded-xl px-3 py-2 text-xs text-white placeholder-ocean-500 focus:outline-none focus:border-pulse-critical"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-ocean-800 hover:bg-ocean-700 text-ocean-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmSOS}
                className="flex-1 py-3 rounded-xl bg-pulse-critical hover:bg-rose-500 text-white font-black text-sm tracking-wide shadow-glow-critical"
              >
                {isSubmitting ? 'TRANSMITTING...' : 'TRANSMIT SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
