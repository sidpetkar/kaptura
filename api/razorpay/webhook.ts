import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { db } from '../_lib/firebase-admin.js';

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing webhook signature' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event as string;
    const payload = event.payload?.subscription?.entity;

    if (!payload) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const uid = payload.notes?.uid as string | undefined;
    if (!uid) {
      console.warn('Webhook event without uid in notes:', eventType);
      return res.status(200).json({ ok: true, skipped: true });
    }

    const now = new Date().toISOString();

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.charged': {
        const periodEnd = new Date();
        const planType = payload.notes?.planType as string;
        if (planType === 'annual') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await db.collection('subscriptions').doc(uid).set({
          status: 'active',
          tier: 'pro',
          planType: planType || 'monthly',
          razorpaySubscriptionId: payload.id,
          currentPeriodEnd: periodEnd.toISOString(),
          updatedAt: now,
        }, { merge: true });
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const subDoc = await db.collection('subscriptions').doc(uid).get();
        const subData = subDoc.data();

        await db.collection('subscriptions').doc(uid).update({
          status: 'cancelled',
          updatedAt: now,
        });

        if (subData?.currentPeriodEnd) {
          const endDate = new Date(subData.currentPeriodEnd);
          if (endDate <= new Date()) {
            await db.collection('subscriptions').doc(uid).update({
              tier: 'free',
            });
          }
        }
        break;
      }

      case 'subscription.paused': {
        await db.collection('subscriptions').doc(uid).update({
          status: 'paused',
          updatedAt: now,
        });
        break;
      }

      case 'subscription.resumed': {
        await db.collection('subscriptions').doc(uid).update({
          status: 'active',
          updatedAt: now,
        });
        break;
      }

      case 'subscription.pending': {
        await db.collection('subscriptions').doc(uid).update({
          status: 'pending',
          updatedAt: now,
        });
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
