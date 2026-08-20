import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Lut } from '../lib/luts'

type LutForm = {
  title: string
  description: string
  author: string
  price: string
  style: string
  file_url: string
  cover_image: string
  preview_image: string
  featured: boolean
}

const emptyForm: LutForm = {
  title: '',
  description: '',
  author: 'Bold Unity',
  price: '0',
  style: '',
  file_url: '',
  cover_image: '',
  preview_image: '',
  featured: false,
}

export default function AdminLuts() {
  const { profile } = useAuth()
  const [luts, setLuts] = useState<Lut[]>([])
  const [form, setForm] = useState<LutForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [lutFile, setLutFile] = useState<File | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)

  useEffect(() => {
    if (!profile?.is_admin) return

    let mounted = true
    async function loadLuts() {
      const { data } = await supabase.from('luts').select('*').order('created_at', { ascending: false })
      if (mounted) {
        setLuts(data ?? [])
        setLoading(false)
      }
    }

    void loadLuts()
    return () => {
      mounted = false
    }
  }, [profile?.is_admin])

  const loadLuts = async () => {
    const { data } = await supabase.from('luts').select('*').order('created_at', { ascending: false })
    setLuts(data ?? [])
  }

  if (!profile?.is_admin) {
    return <p className="text-center py-20 text-[#8a8580]">Admin access required.</p>
  }

  const updateField = (field: keyof LutForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setLutFile(null)
    setPreviewFile(null)
    setMessage(null)
  }

  const editLut = (lut: Lut) => {
    setEditingId(lut.id)
    setForm({
      title: lut.title,
      description: lut.description ?? '',
      author: lut.author ?? '',
      price: String(lut.price),
      style: lut.style ?? '',
      file_url: lut.file_url ?? '',
      cover_image: lut.cover_image ?? '',
      preview_image: lut.preview_image ?? '',
      featured: lut.featured,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveLut = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      if (lutFile && !lutFile.name.toLowerCase().endsWith('.cube')) {
        throw new Error('The LUT asset must be a .cube file.')
      }
      if (previewFile && !previewFile.type.startsWith('image/')) {
        throw new Error('The preview asset must be an image.')
      }

      const baseName = form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      let filePath = form.file_url.trim() || null
      let previewUrl = form.preview_image.trim() || form.cover_image.trim() || null

      if (lutFile) {
        filePath = `luts/${baseName}/${lutFile.name}`
        const { error } = await supabase.storage.from('lut-assets').upload(filePath, lutFile, { upsert: true })
        if (error) throw error
      }

      if (previewFile) {
        const previewPath = `previews/${baseName}/${previewFile.name}`
        const { error } = await supabase.storage.from('lut-previews').upload(previewPath, previewFile, { upsert: true })
        if (error) throw error
        previewUrl = supabase.storage.from('lut-previews').getPublicUrl(previewPath).data.publicUrl
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        author: form.author.trim() || null,
        price: Number(form.price) || 0,
        style: form.style.trim() || null,
        file_url: filePath,
        cover_image: previewUrl,
        preview_image: previewUrl,
        featured: form.featured,
      }

      const result = editingId
        ? await supabase.from('luts').update(payload).eq('id', editingId)
        : await supabase.from('luts').insert(payload)

      if (result.error) throw result.error
      setMessage(editingId ? 'LUT updated.' : 'LUT created.')
      resetForm()
      await loadLuts()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save LUT.')
    } finally {
      setSaving(false)
    }
  }

  const deleteLut = async (id: string) => {
    if (!window.confirm('Delete this LUT record? Storage files are not deleted.')) return
    const { error } = await supabase.from('luts').delete().eq('id', id)
    setMessage(error?.message ?? 'LUT deleted.')
    if (!error) await loadLuts()
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div>
        <span className="marketplace-kicker">BOLD UNITY / ADMIN</span>
        <h1 className="text-4xl font-serif text-[#f5f2ed]">LUT library management</h1>
        <p className="text-sm text-[#8a8580] mt-2">Create and maintain catalog records. Upload assets separately in Supabase Storage.</p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-[#222] pb-3" aria-label="Admin sections">
        <Link to="/admin/luts" className="bg-[#c8102e] text-white px-4 py-2 text-xs uppercase tracking-widest">
          LUT Library
        </Link>
        <Link to="/admin/plans" className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest theme-primary hover:border-[#c8102e]">
          Subscription Plans
        </Link>
        <Link to="/admin/reviews" className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest theme-primary hover:border-[#c8102e]">
          Reviews
        </Link>
      </nav>

      <form onSubmit={saveLut} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111] border border-[#222] p-6">
        {(['title', 'author', 'price', 'style', 'file_url', 'cover_image', 'preview_image'] as const).map((field) => (
          <label key={field} className="space-y-1 text-xs text-[#8a8580] uppercase tracking-wider">
            {field.replace('_', ' ')}
            <input
              required={field === 'title'}
              type={field === 'price' ? 'number' : 'text'}
              min={field === 'price' ? 0 : undefined}
              value={form[field]}
              onChange={(event) => updateField(field, event.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm normal-case tracking-normal text-[#f5f2ed]"
            />
          </label>
        ))}

        <label className="space-y-1 text-xs text-[#8a8580] uppercase tracking-wider">
          LUT asset (.cube)
          <input type="file" accept=".cube" onChange={(event) => setLutFile(event.target.files?.[0] ?? null)} className="w-full text-xs text-[#8a8580] file:mr-3 file:border-0 file:bg-[#c8102e] file:px-3 file:py-2 file:text-xs file:text-white" />
        </label>

        <label className="space-y-1 text-xs text-[#8a8580] uppercase tracking-wider">
          Preview image
          <input type="file" accept="image/*" onChange={(event) => setPreviewFile(event.target.files?.[0] ?? null)} className="w-full text-xs text-[#8a8580] file:mr-3 file:border-0 file:bg-[#c8102e] file:px-3 file:py-2 file:text-xs file:text-white" />
        </label>

        <label className="md:col-span-2 space-y-1 text-xs text-[#8a8580] uppercase tracking-wider">
          description
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} className="w-full min-h-24 bg-[#0a0a0a] border border-[#333] px-3 py-2 text-sm normal-case tracking-normal text-[#f5f2ed]" />
        </label>

        <label className="flex items-center gap-2 text-xs text-[#8a8580] uppercase tracking-wider">
          <input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />
          featured
        </label>

        <div className="flex justify-end gap-3 md:col-span-2">
          {editingId && <button type="button" onClick={resetForm} className="border border-[#333] px-4 py-2 text-xs uppercase tracking-widest text-[#8a8580]">Cancel</button>}
          <button disabled={saving} className="bg-[#c8102e] px-5 py-2 text-xs uppercase tracking-widest text-white disabled:opacity-50">{saving ? 'Saving...' : editingId ? 'Update LUT' : 'Create LUT'}</button>
        </div>
        {message && <p className="md:col-span-2 text-xs text-[#c8102e]">{message}</p>}
      </form>

      {loading ? <p className="text-[#8a8580]">Loading LUTs...</p> : (
        <div className="space-y-3">
          {luts.map((lut) => (
            <div key={lut.id} className="flex items-center justify-between gap-4 border border-[#222] bg-[#111] p-4">
              <div className="min-w-0"><p className="text-[#f5f2ed] font-serif">{lut.title}</p><p className="text-xs text-[#8a8580]">{lut.price === 0 ? 'Free' : `KES ${lut.price.toLocaleString()}`} · {lut.file_url ?? 'No asset linked'}</p></div>
              <div className="flex gap-2 shrink-0"><button onClick={() => editLut(lut)} className="border border-[#333] px-3 py-2 text-xs text-[#f5f2ed]">Edit</button><button onClick={() => deleteLut(lut.id)} className="border border-[#5b1825] px-3 py-2 text-xs text-[#c8102e]">Delete</button></div>
            </div>
          ))}
          {luts.length === 0 && <p className="border border-dashed border-[#333] p-8 text-center text-sm text-[#8a8580]">No LUTs in the catalog yet.</p>}
        </div>
      )}
    </div>
  )
}
