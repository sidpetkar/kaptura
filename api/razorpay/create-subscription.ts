import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, db } from '../_lib/firebase-admin.js';
import { razorpay, PLAN_IDS } from '../_lib/razorpay.js';

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

    const { planType } = req.body as { planType?: string };
    if (!planType || !PLAN_IDS[planType]) {
      return res.status(400).json({ error: 'Invalid planType. Use "monthly" or "annual".' });
    }

    const existingDoc = await db.collection('subscriptions').doc(uid).get();
    if (existingDoc.exists) {
      const data = existingDoc.data();
      if (data?.status === 'active') {
        return res.status(400).json({ error: 'You already have an active subscription.' });
      }
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: PLAN_IDS[planType],
      total_count: planType === 'monthly' ? 120 : 10,
      customer_notify: 1,
      notes: { uid, planType },
    });

    await db.collection('subscriptions').doc(uid).set({
      razorpaySubscriptionId: subscription.id,
      planType,
      status: 'created',
      tier: 'free',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return res.status(200).json({ subscriptionId: subscription.id });
  } catch (err: any) {
    console.error('create-subscription error:', err);

    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }

    return res.status(500).json({ error: 'Failed to create subscription' });
  }
}
