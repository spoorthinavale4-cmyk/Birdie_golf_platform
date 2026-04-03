import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatMonth(date: string | Date): string {
  return format(new Date(date), 'MMMM yyyy')
}

export function getMonthBounds(date: Date = new Date()) {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
    firstDay: format(startOfMonth(date), 'yyyy-MM-01'),
  }
}

export function tierLabel(tier: string): string {
  return { five: '5-Match 🏆', four: '4-Match 🥈', three: '3-Match 🥉' }[tier] ?? tier
}

export function tierColor(tier: string): string {
  return {
    five: 'text-gold',
    four: 'text-ivory',
    three: 'text-sage',
  }[tier] ?? 'text-ivory-dim'
}

export function statusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-sage/20 text-sage border-sage/30',
    cancelled: 'bg-red-900/20 text-red-400 border-red-800/30',
    lapsed: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
    pending: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
    verified: 'bg-sage/20 text-sage border-sage/30',
    rejected: 'bg-red-900/20 text-red-400 border-red-800/30',
    paid: 'bg-gold/20 text-gold border-gold/30',
    draft: 'bg-obsidian-muted text-ivory-dim border-white/10',
    simulated: 'bg-blue-900/20 text-blue-400 border-blue-800/30',
    published: 'bg-sage/20 text-sage border-sage/30',
  }
  return map[status] ?? 'bg-obsidian-muted text-ivory-dim'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function numberToWords(n: number): string {
  return ['', 'one', 'two', 'three', 'four', 'five'][n] ?? String(n)
}
