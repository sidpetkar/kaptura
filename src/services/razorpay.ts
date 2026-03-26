import type { User } from 'firebase/auth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptLoaded = false;

function loadScript(): Promise<void> {
  if (scriptLoaded || window.Razorpay) {
    scriptLoaded = true;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

async function apiCall(path: string, user: User, body?: object) {
  const idToken = await user.getIdToken();
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API request failed');
  return data;
}

export interface SubscriptionResult {
  verified: boolean;
  tier: string;
  currentPeriodEnd: string;
}

export async function startSubscription(
  planType: 'monthly' | 'annual',
  user: User,
): Promise<SubscriptionResult> {
  await loadScript();

  const { subscriptionId } = await apiCall('/api/razorpay/create-subscription', user, { planType });

  return new Promise((resolve, reject) => {
    const options = {
      key: RAZORPAY_KEY,
      subscription_id: subscriptionId,
      name: 'Solaire',
      description: planType === 'monthly' ? 'Pro Monthly — ₹99/mo' : 'Pro Annual — ₹799/yr',
      theme: { color: '#FBBF24' },
      prefill: {
        name: user.displayName || undefined,
        email: user.email || undefined,
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_subscription_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const result = await apiCall('/api/razorpay/verify', user, response);
          resolve(result as SubscriptionResult);
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
        escape: true,
        backdropclose: false,
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}

export async function fetchSubscriptionStatus(user: User) {
  return apiCall('/api/razorpay/status', user);
}
