import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { plan, email, password, fullName, charityId, charityPercentage } = await req.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const normalizedEmail = String(email).trim().toLowerCase()

    // ── 1. Create auth user ──
    // Try admin.createUser first; if it fails due to a database trigger error,
    // fall back to auth.signUp which is more forgiving.
    let userId: string

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) {
      console.error('[subscriptions/create] admin.createUser failed:', authError.message, '| status:', authError.status)

      // If the user already exists, tell them to sign in
      if (authError.message?.includes('already') || authError.message?.includes('registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        )
      }

      // Database trigger error — try fallback via auth.signUp
      if (authError.message?.includes('Database') || authError.status === 500) {
        console.log('[subscriptions/create] Falling back to auth.signUp...')

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
          },
        })

        if (signUpError) {
          console.error('[subscriptions/create] signUp also failed:', signUpError.message)

          // Last resort: check if user was partially created
          const { data: listData } = await supabase.auth.admin.listUsers()
          const existingUser = listData?.users?.find(
            (u) => u.email?.toLowerCase() === normalizedEmail
          )

          if (existingUser) {
            console.log('[subscriptions/create] Found partially-created user:', existingUser.id)
            userId = existingUser.id
          } else {
            return NextResponse.json({ error: signUpError.message }, { status: 500 })
          }
        } else if (signUpData.user) {
          userId = signUpData.user.id
          console.log('[subscriptions/create] signUp succeeded, user:', userId)

          // Confirm email via admin API since signUp may not auto-confirm
          await supabase.auth.admin.updateUserById(userId, { email_confirm: true })
        } else {
          return NextResponse.json({ error: 'Signup failed: no user returned.' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    } else {
      userId = authData.user.id
    }

    console.log('[subscriptions/create] User ID:', userId, '| Creating profile...')

    // ── 2. Create profile manually ──
    const role = (adminEmail && normalizedEmail === adminEmail) ? 'admin' : 'subscriber'
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: normalizedEmail,
        role,
        charity_id: charityId || null,
        charity_percentage: typeof charityPercentage === 'number' ? charityPercentage : 10,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('[subscriptions/create] Profile upsert error:', profileError)
      // Don't throw — the user exists, profile might have been created by trigger
      // Try an UPDATE instead
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: normalizedEmail,
          role,
          charity_id: charityId || null,
          charity_percentage: typeof charityPercentage === 'number' ? charityPercentage : 10,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('[subscriptions/create] Profile update also failed:', updateError)
      }
    }

    // ── 3. Create subscription ──
    const now = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (plan === 'yearly' ? 12 : 1))

    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      stripe_customer_id: `mock_${userId}`,
      stripe_subscription_id: `mock_sub_${Date.now()}`,
      plan,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    })

    if (subscriptionError) {
      console.error('[subscriptions/create] Subscription error:', subscriptionError)
      throw subscriptionError
    }

    // ── 4. Charity contribution ──
    if (charityId) {
      const planAmount = plan === 'yearly' ? 96 : 10
      const pct = typeof charityPercentage === 'number' ? charityPercentage : 10
      const contribution = planAmount * (pct / 100)
      const monthStr = now.toISOString().split('T')[0].slice(0, 7) + '-01'

      await supabase.from('charity_contributions').insert({
        user_id: userId,
        charity_id: charityId,
        amount: contribution,
        month: monthStr,
      })
    }

    return NextResponse.json({
      userId,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
    })
  } catch (error: any) {
    console.error('[subscriptions/create] Unhandled error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
