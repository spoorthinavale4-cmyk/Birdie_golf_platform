'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminUserActions({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggleAdmin() {
    setLoading(true)
    const newRole = currentRole === 'admin' ? 'subscriber' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggleAdmin}
      disabled={loading}
      className="text-xs btn-ghost py-1 px-2.5"
    >
      {loading ? '...' : currentRole === 'admin' ? 'Remove Admin' : 'Make Admin'}
    </button>
  )
}
