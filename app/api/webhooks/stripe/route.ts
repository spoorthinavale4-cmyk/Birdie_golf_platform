import { NextRequest, NextResponse } from 'next/server'
import { stripe, POOL_CONTRIBUTION } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

// App Router handles raw body automatically via req.text() — no config needed

async function syncSubscription(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) return

  const plan = subscription.metadata?.plan || 'monthly'
  const status = subscription.status === 'active' ? 'active'
    : subscription.status === 'trialing' ? 'trialing'
    : subscription.status === 'canceled' ? 'cancelled'
    : 'lapsed'

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    plan,
    status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }, { onConflict: 'stripe_subscription_id' })

  // If newly active — record charity contribution
  if (status === 'active') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('charity_id, charity_percentage')
      .eq('id', userId)
      .single()

    if (profile?.charity_id) {
      const month = new Date()
      month.setDate(1)
      const monthStr = month.toISOString().split('T')[0]

      const planAmount = plan === 'yearly' ? 9600 : 1000 // pence
      const contribution = (planAmount * (profile.charity_percentage / 100)) / 100 // to pounds

      // Upsert to avoid duplicates (idempotent)
      await supabase.from('charity_contributions').upsert({
        user_id: userId,
        charity_id: profile.charity_id,
        amount: contribution,
        month: monthStr,
      }, { onConflict: 'user_id,month' })

      // Update charity total
      await supabase.rpc('increment_charity_total', {
        charity_uuid: profile.charity_id,
        increment_amount: contribution,
      })
    }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription
        await supabase.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', deletedSub.id)
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
          await syncSubscription(supabase, sub)
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        if (failedInvoice.subscription) {
          await supabase.from('subscriptions')
            .update({ status: 'lapsed' })
            .eq('stripe_subscription_id', failedInvoice.subscription as string)
        }
        break

      default:
        // Unhandled event — ignore
        break
    }
  } catch (err: any) {
    console.error('[Webhook] Handler error:', err.message)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
