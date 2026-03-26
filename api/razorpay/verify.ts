import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { adminAuth, db } from '../_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body as {
      razorpay_payment_id?: string;
      razorpay_subscription_id?: string;
      razorpay_signature?: string;
    };

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment fields' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server config error' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const subDoc = await db.collection('subscriptions').doc(uid).get();
    const subData = subDoc.data();
    if (subData?.razorpaySubscriptionId !== razorpay_subscription_id) {
      return res.status(400).json({ error: 'Subscription mismatch' });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (subData?.planType === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await db.collection('subscriptions').doc(uid).update({
      status: 'active',
      tier: 'pro',
      razorpayPaymentId: razorpay_payment_id,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      updatedAt: now.toISOString(),
    });

    return res.status(200).json({
      verified: true,
      tier: 'pro',
      currentPeriodEnd: periodEnd.toISOString(),
    });
  } catch (err: any) {
    console.error('verify error:', err);

    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }

    return res.status(500).json({ error: 'Verification failed' });
  }
}
