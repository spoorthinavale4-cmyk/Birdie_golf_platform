'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Charity } from '@/types'

export default function AdminCharitiesPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Charity | null>(null)
  const [saving, setSaving] = useState(false)

  const empty = { name: '', short_description: '', description: '', image_url: '', website_url: '' }
  const [form, setForm] = useState(empty)

  async function fetchCharities() {
    const { data } = await supabase.from('charities').select('*').order('featured', { ascending: false }).order('name')
    setCharities(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCharities()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
  }

  function openEdit(charity: Charity) {
    setEditing(charity)
    setForm({
      name: charity.name,
      short_description: charity.short_description,
      description: charity.description,
      image_url: charity.image_url || '',
      website_url: charity.website_url || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    if (editing) {
      await supabase.from('charities').update(form).eq('id', editing.id)
    } else {
      await supabase.from('charities').insert({ ...form, active: true, featured: false })
    }
    setShowForm(false)
    await fetchCharities()
    setSaving(false)
  }

  async function toggleFeatured(charity: Charity) {
    await supabase.from('charities').update({ featured: !charity.featured }).eq('id', charity.id)
    await fetchCharities()
  }

  async function toggleActive(charity: Charity) {
    await supabase.from('charities').update({ active: !charity.active }).eq('id', charity.id)
    await fetchCharities()
  }

  async function deleteCharity(id: string) {
    if (!confirm('Delete this charity?')) return
    await supabase.from('charities').delete().eq('id', id)
    await fetchCharities()
  }

  return (
    <div className="page-container max-w-6xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="birdie-label mb-2">Admin charities</p>
          <h1 className="birdie-heading-md text-foreground">Manage charity catalogue</h1>
          <p className="birdie-body mt-2">Control which charities are featured, active, and visible in the member experience.</p>
        </div>
        <button onClick={openCreate} className="btn-gold">
          <Plus className="h-4 w-4" />
          Add charity
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="birdie-heading-sm text-foreground">{editing ? 'Edit charity' : 'Add charity'}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: 'name', label: 'Name', placeholder: 'Charity name' },
                { key: 'short_description', label: 'Short description', placeholder: 'One-line description' },
                { key: 'image_url', label: 'Image URL', placeholder: 'https://...' },
                { key: 'website_url', label: 'Website URL', placeholder: 'https://...' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="birdie-label mb-2 block">{field.label}</label>
                  <input
                    type="text"
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="birdie-input"
                  />
                </div>
              ))}

              <div>
                <label className="birdie-label mb-2 block">Full description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="birdie-input resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-gold flex-1 justify-center">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {charities.map((charity) => (
            <div key={charity.id} className="birdie-card-elevated flex items-center gap-4 p-4">
              {charity.image_url && (
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={charity.image_url} alt={charity.name} className="h-full w-full object-cover" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{charity.name}</p>
                  {charity.featured && <span className="birdie-badge-gold">Featured</span>}
                  {!charity.active && <span className="birdie-badge bg-destructive/10 text-destructive">Inactive</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{charity.short_description}</p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-1">
                <button onClick={() => toggleFeatured(charity)} className={`p-2 transition-colors ${charity.featured ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`} title="Toggle featured">
                  <Star className="h-4 w-4" fill={charity.featured ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => toggleActive(charity)} className={`px-2 py-1 text-xs font-medium ${charity.active ? 'text-primary' : 'text-muted-foreground'}`} title="Toggle active">
                  {charity.active ? 'On' : 'Off'}
                </button>
                <button onClick={() => openEdit(charity)} className="p-2 text-muted-foreground transition-colors hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => deleteCharity(charity.id)} className="p-2 text-muted-foreground transition-colors hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
