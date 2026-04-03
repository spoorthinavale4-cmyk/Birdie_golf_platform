import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    amount: 1000, // £10.00 in pence
    label: 'Monthly',
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    amount: 9600, // £96.00 in pence (20% off)
    label: 'Yearly',
    interval: 'year' as const,
  },
}

export const POOL_CONTRIBUTION = Number(process.env.POOL_CONTRIBUTION_PER_SUB || 500) // pence

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}
