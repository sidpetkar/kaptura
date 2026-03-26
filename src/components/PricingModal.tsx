import { useState, useCallback } from 'react';
import { X, Crown, Check } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { startSubscription } from '../services/razorpay';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Monthly',
    price: '₹99',
    period: '/month',
    badge: null,
  },
  {
    id: 'annual' as const,
    name: 'Annual',
    price: '₹799',
    period: '/year',
    badge: 'Save 33%',
  },
];

const FEATURES = [
  'No watermark on downloads',
  'All LUT filter packs',
  'Full adjustment tools',
  'Priority AI editing',
];

export default function PricingModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const { refresh } = useSubscription();
  const [selected, setSelected] = useState<'monthly' | 'annual'>('annual');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = useCallback(async () => {
    if (!user) return;
    setProcessing(true);
    setError(null);

    try {
      await startSubscription(selected, user);
      await refresh();
      onClose();
    } catch (err: any) {
      if (err.message === 'Payment cancelled') {
        setProcessing(false);
        return;
      }
      setError(err.message || 'Something went wrong');
    } finally {
      setProcessing(false);
    }
  }, [user, selected, refresh, onClose]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !processing) onClose();
    },
    [onClose, processing],
  );

  if (!open) return null;

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div
        className="md:hidden fixed inset-0 z-50 flex items-end justify-center animate-panel-fade"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={handleBackdrop}
      >
        <div className="w-full max-w-md bg-surface rounded-t-2xl px-5 pt-6 pb-8 animate-panel-slide-up">
          <PricingContent
            selected={selected}
            onSelect={setSelected}
            onSubscribe={handleSubscribe}
            processing={processing}
            error={error}
          />
        </div>
      </div>

      {/* Desktop: centered popup */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center animate-panel-fade"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={handleBackdrop}
      >
        <div className="w-[420px] bg-surface rounded-2xl px-6 pt-5 pb-6 shadow-2xl animate-panel-fade">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown size={20} weight="fill" className="text-amber-400" />
              <h3 className="text-sm font-medium tracking-wider text-accent uppercase">
                Solaire Pro
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={processing}
              className="text-accent/60 hover:text-accent p-1"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <PricingContent
            selected={selected}
            onSelect={setSelected}
            onSubscribe={handleSubscribe}
            processing={processing}
            error={error}
          />
        </div>
      </div>
    </>
  );
}

function PricingContent({
  selected,
  onSelect,
  onSubscribe,
  processing,
  error,
}: {
  selected: 'monthly' | 'annual';
  onSelect: (plan: 'monthly' | 'annual') => void;
  onSubscribe: () => void;
  processing: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 md:hidden justify-center mb-1">
        <Crown size={20} weight="fill" className="text-amber-400" />
        <h3 className="text-sm font-medium tracking-wider text-accent uppercase">
          Solaire Pro
        </h3>
      </div>

      {/* Plan selector */}
      <div className="flex gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            disabled={processing}
            className={`flex-1 relative rounded-xl border-2 px-4 py-4 transition-all ${
              selected === plan.id
                ? 'border-amber-400 bg-amber-400/10'
                : 'border-white/10 bg-surface-lighter'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-surface text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase">
                {plan.badge}
              </span>
            )}
            <span className="block text-[11px] tracking-wider text-muted mb-1">
              {plan.name}
            </span>
            <span className="text-lg font-bold text-accent tracking-wide">
              {plan.price}
            </span>
            <span className="text-[10px] text-muted tracking-wider">
              {plan.period}
            </span>
          </button>
        ))}
      </div>

      {/* Features list */}
      <div className="flex flex-col gap-2 py-2">
        {FEATURES.map((feature) => (
          <div key={feature} className="flex items-center gap-2.5">
            <Check size={14} weight="bold" className="text-amber-400 shrink-0" />
            <span className="text-[11px] tracking-wider text-accent/80 normal-case">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-[11px] tracking-wider text-red-400 text-center normal-case">
          {error}
        </p>
      )}

      {/* Subscribe button */}
      <button
        onClick={onSubscribe}
        disabled={processing}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all ${
          processing
            ? 'bg-amber-400/50 text-surface/70 cursor-wait'
            : 'bg-amber-400 text-surface hover:bg-amber-300'
        }`}
      >
        {processing ? 'Processing...' : `Subscribe — ${selected === 'monthly' ? '₹99/mo' : '₹799/yr'}`}
      </button>

      <p className="text-[9px] tracking-wider text-muted/60 text-center normal-case">
        Cancel anytime. Powered by Razorpay.
      </p>
    </div>
  );
}
