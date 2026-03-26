import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, db } from '../_lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

    const subDoc = await db.collection('subscriptions').doc(uid).get();

    if (!subDoc.exists) {
      return res.status(200).json({
        tier: 'free',
        status: null,
        planType: null,
        currentPeriodEnd: null,
      });
    }

    const data = subDoc.data()!;

    if (data.status === 'cancelled' && data.currentPeriodEnd) {
      const endDate = new Date(data.currentPeriodEnd);
      if (endDate <= new Date()) {
        await db.collection('subscriptions').doc(uid).update({ tier: 'free' });
        data.tier = 'free';
      }
    }

    return res.status(200).json({
      tier: data.tier || 'free',
      status: data.status || null,
      planType: data.planType || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
    });
  } catch (err: any) {
    console.error('status error:', err);

    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid or expired auth token' });
    }

    return res.status(500).json({ error: 'Failed to fetch status' });
  }
}
