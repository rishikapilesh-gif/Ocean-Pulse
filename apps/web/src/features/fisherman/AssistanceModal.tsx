import React, { useState } from 'react';
import { ASSISTANCE_CATEGORIES, AssistanceCategory } from '@ocean-pulse/shared';
import { LifeBuoy, X, Droplet, Utensils, Fuel, Wrench, HeartPulse, Send } from 'lucide-react';

interface AssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category: AssistanceCategory; details: string; urgency: string }) => Promise<void>;
  isSubmitting: boolean;
}

export const AssistanceModal: React.FC<AssistanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [category, setCategory] = useState<AssistanceCategory>('DRINKING_WATER');
  const [details, setDetails] = useState('');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;
    await onSubmit({ category, details, urgency });
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-ocean-950 border border-ocean-600 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-ocean-800 pb-2">
          <h3 className="font-bold text-sm text-pulse-cyan flex items-center gap-2">
            <LifeBuoy className="w-4 h-4" />
            Request Supplies / Assistance
          </h3>
          <button onClick={onClose} className="text-ocean-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-ocean-300 mb-1 font-medium">Select Resource Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['DRINKING_WATER', 'Drinking Water'],
                ['FOOD', 'Rations / Food'],
                ['FUEL', 'Diesel / Fuel'],
                ['MECHANICAL', 'Engine / Towing'],
                ['MEDICAL', 'First Aid'],
                ['OTHER', 'Other Supplies'],
              ].map(([cat, label]) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat as AssistanceCategory)}
                  className={`p-2 rounded-lg border text-left font-semibold transition-colors ${
                    category === cat
                      ? 'bg-ocean-800 border-pulse-cyan text-pulse-cyan'
                      : 'bg-ocean-900 border-ocean-700 text-ocean-300 hover:border-ocean-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-ocean-300 mb-1 font-medium">Quantity or Specific Requirement</label>
            <textarea
              required
              placeholder="e.g. Need 40 liters of diesel or 20L clean drinking water..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full bg-ocean-900 border border-ocean-700 rounded-lg p-2.5 text-xs text-white placeholder-ocean-500 h-20"
            />
          </div>

          <div>
            <label className="block text-ocean-300 mb-1 font-medium">Urgency Level</label>
            <div className="flex gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUrgency(u)}
                  className={`flex-1 py-1.5 rounded-lg border font-bold text-xs uppercase ${
                    urgency === u
                      ? 'bg-pulse-cyan text-ocean-950 border-pulse-cyan'
                      : 'bg-ocean-900 border-ocean-700 text-ocean-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-ocean-800 text-ocean-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !details.trim()}
              className="flex-1 py-2.5 rounded-xl bg-pulse-cyan hover:bg-cyan-400 text-ocean-950 font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
