import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET env vars');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const PLAN_IDS: Record<string, string> = {
  monthly: process.env.RAZORPAY_PLAN_MONTHLY!,
  annual: process.env.RAZORPAY_PLAN_ANNUAL!,
};
