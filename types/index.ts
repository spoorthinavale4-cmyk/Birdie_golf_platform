// ============================================================
// GOLF CHARITY PLATFORM — Type Definitions
// ============================================================

export type UserRole = 'subscriber' | 'admin'
export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'lapsed' | 'trialing'
export type DrawStatus = 'draft' | 'simulated' | 'published'
export type DrawType = 'random' | 'algorithmic'
export type WinnerTier = 'five' | 'four' | 'three'
export type WinnerStatus = 'pending' | 'verified' | 'rejected' | 'paid'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  charity_id: string | null
  charity_percentage: number
  avatar_url: string | null
  created_at: string
  updated_at: string
  charities?: Charity
  subscriptions?: Subscription[]
}

export interface Charity {
  id: string
  name: string
  description: string
  short_description: string
  image_url: string | null
  website_url: string | null
  featured: boolean
  active: boolean
  total_contributions: number
  upcoming_events: CharityEvent[]
  created_at: string
  updated_at: string
}

export interface CharityEvent {
  title: string
  date: string
  location: string
  description?: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  played_at: string
  created_at: string
}

export interface Draw {
  id: string
  month: string
  status: DrawStatus
  draw_type: DrawType
  winning_numbers: number[] | null
  pool_total: number
  jackpot_carried_forward: number
  five_match_pool: number
  four_match_pool: number
  three_match_pool: number
  total_entries: number
  simulation_numbers: number[] | null
  notes: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  numbers: number[]
  matched_count: number
  tier: WinnerTier | null
  processed_at: string
  profiles?: Profile
  draws?: Draw
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  tier: WinnerTier
  prize_amount: number
  proof_url: string | null
  admin_notes: string | null
  status: WinnerStatus
  verified_at: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  draws?: Draw
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  amount: number
  month: string
  subscription_id: string | null
  created_at: string
  charities?: Charity
}

export interface PrizePools {
  five_match: number
  four_match: number
  three_match: number
  total: number
}

export interface DrawResult {
  draw: Draw
  entries: DrawEntry[]
  winners: Winner[]
  pools: PrizePools
}

// Admin analytics
export interface AdminStats {
  total_users: number
  active_subscribers: number
  total_prize_pool: number
  total_charity_contributions: number
  total_draws: number
  pending_winners: number
}
