import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, X, Save, Pill } from 'lucide-react'
import api from '../../utils/api'
import { formOptions, scheduleOptions, gstOptions } from '../../utils/helpers'
import toast from 'react-hot-toast'

const EMPTY = { name:'', generic_name:'', brand:'', category:'', form:'Tablet', strength:'', unit:'Tabs', barcode:'', hsn_code:'30049099', gst_rate:12, manufacturer:'', schedule:'OTC', reorder_level:10, min_stock:5, rack_location:'' }

function MedModal({ med, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(med || EMPTY)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const mutation = useMutation({
    mutationFn: () => med
      ? api.put(`/medicines/${med.id}`, form)
      : api.post('/medicines', form),
    onSuccess: () => {
      toast.success(med ? 'Medicine updated' : 'Medicine added')
      qc.invalidateQueries(['medicines'])
      onClose()
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal max-w-2xl w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{med ? 'Edit Medicine' : 'Add Medicine'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16}/></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Medicine Name *</label>
            <input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Paracetamol 500mg Tab"/>
          </div>
          <div><label className="label">Generic Name</label><input className="input" value={form.generic_name} onChange={e=>set('generic_name',e.target.value)}/></div>
          <div><label className="label">Brand</label><input className="input" value={form.brand} onChange={e=>set('brand',e.target.value)}/></div>
          <div><label className="label">Category</label><input className="input" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="e.g. Antibiotic"/></div>
          <div>
            <label className="label">Form</label>
            <select className="select" value={form.form} onChange={e=>set('form',e.target.value)}>
              {formOptions.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label className="label">Strength</label><input className="input" value={form.strength} onChange={e=>set('strength',e.target.value)} placeholder="e.g. 500mg"/></div>
          <div><label className="label">Unit</label><input className="input" value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="Tabs / Caps / Bot"/></div>
          <div><label className="label">Barcode</label><input className="input font-mono" value={form.barcode} onChange={e=>set('barcode',e.target.value)}/></div>
          <div><label className="label">HSN Code</label><input className="input" value={form.hsn_code} onChange={e=>set('hsn_code',e.target.value)}/></div>
          <div>
            <label className="label">GST Rate (%)</label>
            <select className="select" value={form.gst_rate} onChange={e=>set('gst_rate',parseFloat(e.target.value))}>
              {gstOptions.map(g=><option key={g} value={g}>{g}%</option>)}
            </select>
          </div>
          <div>
            <label className="label">Schedule</label>
            <select className="select" value={form.schedule} onChange={e=>set('schedule',e.target.value)}>
              {scheduleOptions.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label className="label">Manufacturer</label><input className="input" value={form.manufacturer} onChange={e=>set('manufacturer',e.target.value)}/></div>
          <div><label className="label">Reorder Level</label><input className="input" type="number" value={form.reorder_level} onChange={e=>set('reorder_level',parseInt(e.target.value))}/></div>
          <div><label className="label">Min Stock</label><input className="input" type="number" value={form.min_stock} onChange={e=>set('min_stock',parseInt(e.target.value))}/></div>
          <div className="col-span-2"><label className="label">Rack Location</label><input className="input" value={form.rack_location} onChange={e=>set('rack_location',e.target.value)} placeholder="e.g. A-12"/></div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!form.name || mutation.isPending} onClick={()=>mutation.mutate()}>
            <Save size={14}/>{mutation.isPending ? 'Saving...' : 'Save Medicine'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MedicinesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | medicine object

  const { data: medicines=[], isLoading } = useQuery({
    queryKey: ['medicines', search, category],
    queryFn: () => api.get('/medicines', { params:{ search:search||undefined, category:category||undefined, limit:200 } }).then(r=>r.data),
  })

  const categories = [...new Set(medicines.map(m=>m.category).filter(Boolean))].sort()
  const filtered = medicines.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.barcode?.includes(search)
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-xl font-bold text-gray-900">Medicines</h1>
          <p className="text-xs text-gray-400">{medicines.length} medicines in master</p></div>
        <button className="btn-primary" onClick={()=>setModal('add')}><Plus size={15}/>Add Medicine</button>
      </div>

      <div className="card mb-4">
        <div className="p-3 border-b border-gray-100 flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-lg px-3">
            <Search size={14} className="text-gray-400"/>
            <input className="flex-1 text-sm outline-none bg-transparent py-1.5 placeholder-gray-400"
              placeholder="Search name, generic, barcode..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="select w-48" value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        {isLoading ? <div className="p-10 text-center text-gray-400 text-sm">Loading medicines...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Medicine</th>
                  <th className="th">Generic</th>
                  <th className="th">Form</th>
                  <th className="th">Category</th>
                  <th className="th">Schedule</th>
                  <th className="th">GST</th>
                  <th className="th">HSN</th>
                  <th className="th">Reorder</th>
                  <th className="th">Rack</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="td">
                      <p className="font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.brand} {m.barcode ? `· ${m.barcode}` : ''}</p>
                    </td>
                    <td className="td text-gray-500 text-xs">{m.generic_name||'—'}</td>
                    <td className="td"><span className="badge badge-gray">{m.form}</span></td>
                    <td className="td text-xs text-gray-500">{m.category||'—'}</td>
                    <td className="td">
                      <span className={`badge ${m.schedule==='OTC'?'badge-green':m.schedule==='H1'||m.schedule==='X'?'badge-red':'badge-yellow'}`}>{m.schedule||'—'}</span>
                    </td>
                    <td className="td text-xs">{m.gst_rate}%</td>
                    <td className="td text-xs font-mono text-gray-400">{m.hsn_code||'—'}</td>
                    <td className="td text-xs">{m.reorder_level}</td>
                    <td className="td text-xs text-gray-400">{m.rack_location||'—'}</td>
                    <td className="td">
                      <button className="btn-ghost btn-sm p-1.5" onClick={()=>setModal(m)}><Edit2 size={13}/></button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">
                    <Pill size={32} className="mx-auto mb-2 opacity-20"/>No medicines found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <MedModal med={modal==='add' ? null : modal} onClose={()=>setModal(null)} />}
    </div>
  )
}
