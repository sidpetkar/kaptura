import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { fetchSubscriptionStatus } from '../services/razorpay';

export type Tier = 'free' | 'pro';

interface SubscriptionState {
  tier: Tier;
  isProUser: boolean;
  status: string | null;
  planType: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const [tier, setTier] = useState<Tier>('free');
  const [status, setStatus] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || isGuest) {
      setTier('free');
      setStatus(null);
      setPlanType(null);
      setCurrentPeriodEnd(null);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchSubscriptionStatus(user);
      setTier(data.tier === 'pro' ? 'pro' : 'free');
      setStatus(data.status);
      setPlanType(data.planType);
      setCurrentPeriodEnd(data.currentPeriodEnd);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setTier('free');
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isProUser = tier === 'pro';

  return (
    <SubscriptionContext.Provider
      value={{ tier, isProUser, status, planType, currentPeriodEnd, loading, refresh }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionState {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
