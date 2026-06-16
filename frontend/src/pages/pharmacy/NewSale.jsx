import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Trash2, ArrowLeft, Search, ShoppingCart, Scan, User, Printer, X, ChevronDown } from 'lucide-react'
import api from '../../utils/api'
import { fmt } from '../../utils/helpers'
import toast from 'react-hot-toast'
import PrintModal from '../../components/shared/PrintModal'

const API_BASE = import.meta.env.VITE_API_URL || ''
const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Credit', 'Insurance']
const PAYMENT_ICONS = { Cash: '💵', Card: '💳', UPI: '📱', Credit: '🔖', Insurance: '🏥' }

function fmtExpiry(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}
function isExpiringSoon(d) {
  if (!d) return false
  return new Date(d) < new Date(new Date().setMonth(new Date().getMonth() + 3))
}

export default function NewSale() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const barcodeRef = useRef()
  const medSearchRef = useRef()

  const [patientId, setPatientId] = useState(sp.get('patient_id') || '')
  const [prescriptionId] = useState(sp.get('prescription_id') || '')
  const [patientSearch, setPatientSearch] = useState('')
  const [items, setItems] = useState([])
  const [medSearch, setMedSearch] = useState('')
  const [medResults, setMedResults] = useState([])
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [discount, setDiscount] = useState(0)
  const [amountPaid, setAmountPaid] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [printUrlFn, setPrintUrlFn] = useState(null)

  useEffect(() => { barcodeRef.current?.focus() }, [])

  const { data: patientResults } = useQuery({
    queryKey: ['pt-search-sale', patientSearch],
    queryFn: () => api.get('/patients', { params: { search: patientSearch, limit: 8 } }).then(r => r.data),
    enabled: patientSearch.length > 1,
    staleTime: 30_000,
  })
  const { data: selectedPatient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => api.get(`/patients/${patientId}`).then(r => r.data),
    enabled: !!patientId,
    staleTime: 60_000,
  })
  const { data: rxData } = useQuery({
    queryKey: ['rx-sale', prescriptionId],
    queryFn: () => api.get(`/prescriptions/${prescriptionId}`).then(r => r.data),
    enabled: !!prescriptionId,
    staleTime: 60_000,
  })

  // Load items from linked prescription — includes gst_rate from backend
  useEffect(() => {
    if (!rxData?.medicines?.length) return
    ;(async () => {
      const rows = []
      for (const m of rxData.medicines) {
        if (!m.medicine_id) continue
        try {
          const { data: batches } = await api.get(`/inventory/batches/${m.medicine_id}`)
          if (batches.length) {
            const b = batches[0]
            rows.push({
              medicine_id:    m.medicine_id,
              medicine_name:  m.medicine_name,
              batch_number:   b.batch_number,
              expiry:         b.expiry_date,
              mrp:            parseFloat(b.mrp),
              quantity:       m.quantity || 1,
              discount_percent: 0,
              available_qty:  b.available_qty,
              gst_rate:       m.gst_rate || 0,   // populated from prescriptions endpoint
              batches,
            })
          }
        } catch { /* skip medicines with no stock */ }
      }
      if (rows.length) setItems(rows)
    })()
  }, [rxData])

  const searchMedicine = async val => {
    setMedSearch(val)
    if (val.length < 2) return setMedResults([])
    const { data } = await api.get('/medicines', { params: { search: val, limit: 12 } })
    setMedResults(data)
  }

  const scanBarcode = async () => {
    if (!barcodeInput.trim()) return
    try {
      const { data } = await api.get(`/inventory/barcode/${barcodeInput}`)
      if (!data.batches?.length) return toast.error('No stock for this barcode')
      const b = data.batches[0]
      const idx = items.findIndex(i => i.medicine_id === data.medicine.id && i.batch_number === b.batch_number)
      if (idx >= 0) {
        setItems(it => it.map((x, i) => i === idx ? { ...x, quantity: x.quantity + 1 } : x))
      } else {
        setItems(it => [...it, {
          medicine_id:     data.medicine.id,
          medicine_name:   data.medicine.name,
          batch_number:    b.batch_number,
          expiry:          b.expiry_date,
          mrp:             parseFloat(b.mrp),
          quantity:        1,
          discount_percent: 0,
          available_qty:   b.available_qty,
          gst_rate:        data.medicine.gst_rate || 0,
          batches:         data.batches,
        }])
      }
      setBarcodeInput('')
      toast.success(`Added: ${data.medicine.name}`)
      barcodeRef.current?.focus()
    } catch { toast.error('Medicine not found') }
  }

  const addMedicine = async med => {
    const { data: batches } = await api.get(`/inventory/batches/${med.id}`)
    if (!batches.length) { toast.error('No stock available'); return }
    const b = batches[0]
    const idx = items.findIndex(i => i.medicine_id === med.id && i.batch_number === b.batch_number)
    if (idx >= 0) {
      setItems(it => it.map((x, i) => i === idx ? { ...x, quantity: x.quantity + 1 } : x))
    } else {
      setItems(it => [...it, {
        medicine_id:      med.id,
        medicine_name:    med.name,
        batch_number:     b.batch_number,
        expiry:           b.expiry_date,
        mrp:              parseFloat(b.mrp),
        quantity:         1,
        discount_percent: 0,
        available_qty:    b.available_qty,
        gst_rate:         med.gst_rate || 0,
        batches,
      }])
    }
    setMedSearch(''); setMedResults([])
    barcodeRef.current?.focus()
  }

  const changeBatch = (idx, batchNo) => {
    const b = items[idx].batches.find(x => x.batch_number === batchNo)
    if (!b) return
    setItems(it => it.map((x, i) => i === idx
      ? { ...x, batch_number: batchNo, expiry: b.expiry_date, mrp: parseFloat(b.mrp), available_qty: b.available_qty }
      : x))
  }

  const updateItem = (idx, patch) => setItems(it => it.map((x, i) => i === idx ? { ...x, ...patch } : x))
  const removeItem = idx => setItems(it => it.filter((_, i) => i !== idx))

  // ── Accurate billing totals (match backend calculation exactly) ────────────
  // Backend applies GST per-item BEFORE the overall bill discount
  const itemLines = items.map(it => {
    const lineTotal  = it.quantity * it.mrp
    const itemDisc   = lineTotal * (it.discount_percent || 0) / 100
    const taxable    = lineTotal - itemDisc
    const gst        = taxable * (it.gst_rate || 0) / 100
    return { taxable, gst }
  })
  const subtotal   = itemLines.reduce((a, v) => a + v.taxable, 0)
  const gstTotal   = itemLines.reduce((a, v) => a + v.gst, 0)
  const overallDiscAmt = subtotal * (discount / 100)
  const afterDisc  = subtotal - overallDiscAmt
  const grandTotal = Math.round(afterDisc + gstTotal)
  const balance    = grandTotal - (parseFloat(amountPaid) || 0)

  const hasGst = gstTotal > 0

  const mut = useMutation({
    mutationFn: d => api.post('/sales', d).then(r => r.data),
    onSuccess: r => {
      toast.success(`Bill ${r.bill_number} created!`)
      const token = localStorage.getItem('pc_token')
      setPrintUrlFn(() => (size) => `${API_BASE}/api/sales/${r.id}/pdf?size=${size}&token=${token}`)
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed to create bill'),
  })

  const submit = () => {
    if (!items.length) return toast.error('Add at least one medicine')
    mut.mutate({
      patient_id:       patientId ? parseInt(patientId) : undefined,
      prescription_id:  prescriptionId ? parseInt(prescriptionId) : undefined,
      payment_mode:     paymentMode,
      discount_percent: parseFloat(discount) || 0,
      amount_paid:      parseFloat(amountPaid) || grandTotal,
      items: items.map(it => ({
        medicine_id:      it.medicine_id,
        batch_number:     it.batch_number,
        quantity:         parseInt(it.quantity),
        mrp:              it.mrp,
        discount_percent: parseFloat(it.discount_percent) || 0,
      })),
    })
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ minHeight: 'calc(100vh - 0px)' }}>
      <PrintModal urlFn={printUrlFn} onClose={() => { setPrintUrlFn(null); navigate('/sales') }} />

      {/* ── Top header bar ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <ShoppingCart size={16} className="text-primary" />
        <h1 className="font-bold text-gray-900 text-base">New Sale / Bill</h1>
        {prescriptionId && <span className="badge badge-green text-xs">📋 Linked to Prescription</span>}

        <div className="mx-4 h-5 w-px bg-gray-200" />

        {/* Inline patient search */}
        <div className="relative">
          {selectedPatient ? (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5 text-sm">
              <User size={13} className="text-primary" />
              <span className="font-medium text-gray-800">{selectedPatient.name}</span>
              <span className="text-xs text-gray-400 ml-1">{selectedPatient.patient_id}</span>
              <button onClick={() => setPatientId('')} className="ml-2 text-gray-300 hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="border border-gray-200 rounded-lg py-1.5 pl-8 pr-3 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder-gray-400"
                placeholder="Link patient (optional)…"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
              />
              {patientResults?.data?.length > 0 && patientSearch && (
                <div className="absolute z-30 top-full left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                  {patientResults.data.map(p => (
                    <button key={p.id} className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm flex items-center justify-between"
                      onClick={() => { setPatientId(String(p.id)); setPatientSearch('') }}>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-gray-400">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main 2-column layout ───────────────────────────── */}
      <div className="flex flex-1 gap-0">

        {/* LEFT — items panel */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">

          {/* Search bar */}
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-3 flex-shrink-0">
            {/* Barcode */}
            <div className="flex items-center gap-2 flex-1 border-2 border-primary/30 bg-primary/5 rounded-lg px-3 py-2 focus-within:border-primary/60 transition-colors">
              <Scan size={15} className="text-primary flex-shrink-0" />
              <input
                ref={barcodeRef}
                className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                placeholder="Scan barcode or type barcode number — press Enter to add"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanBarcode()}
              />
              {barcodeInput && (
                <button onClick={scanBarcode} className="bg-primary text-white text-xs px-2.5 py-0.5 rounded-md font-medium hover:bg-primary-dark transition-colors">
                  Add
                </button>
              )}
            </div>
            {/* Name search */}
            <div className="relative">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 w-60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors bg-white">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  ref={medSearchRef}
                  className="flex-1 text-sm outline-none placeholder-gray-400"
                  placeholder="Search medicine by name…"
                  value={medSearch}
                  onChange={e => searchMedicine(e.target.value)}
                />
              </div>
              {medResults.length > 0 && medSearch && (
                <div className="absolute z-30 top-full right-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 overflow-hidden max-h-64 overflow-y-auto">
                  {medResults.map(m => (
                    <button key={m.id} className="w-full px-4 py-2.5 text-left hover:bg-primary/5 flex justify-between items-center gap-3" onClick={() => addMedicine(m)}>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.generic_name} · {m.form} · {m.strength}</p>
                      </div>
                      {m.gst_rate > 0 && <span className="text-[10px] text-gray-400 flex-shrink-0">GST {m.gst_rate}%</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-8">#</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">Medicine</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left w-40">Batch / Expiry</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right w-24">MRP (₹)</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-20">Qty</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-20">Disc%</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right w-28">Amount</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <ShoppingCart size={40} strokeWidth={1.2} />
                        <div>
                          <p className="text-sm font-medium text-gray-400">No items added yet</p>
                          <p className="text-xs text-gray-300 mt-0.5">Scan a barcode or search medicine above</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : items.map((it, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-gray-900">{it.medicine_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">
                          Avail: <span className={it.available_qty <= 10 ? 'text-orange-500 font-medium' : ''}>{it.available_qty} units</span>
                        </p>
                        {it.gst_rate > 0 && (
                          <span className="text-[10px] text-gray-400">GST {it.gst_rate}%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {it.batches?.length > 1 ? (
                        <div className="relative inline-block">
                          <select
                            className="appearance-none border border-gray-200 rounded-lg text-xs py-1 pl-2 pr-6 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary/40"
                            value={it.batch_number}
                            onChange={e => changeBatch(i, e.target.value)}
                          >
                            {it.batches.map(b => <option key={b.batch_number} value={b.batch_number}>{b.batch_number}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{it.batch_number}</span>
                      )}
                      <p className={`text-xs mt-1 font-medium ${isExpiringSoon(it.expiry) ? 'text-orange-500' : 'text-gray-400'}`}>
                        Exp: {fmtExpiry(it.expiry)}{isExpiringSoon(it.expiry) ? ' ⚠' : ''}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number" step="0.01" min="0"
                        className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 w-20 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                        value={it.mrp}
                        onChange={e => updateItem(i, { mrp: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="number" min="1" max={it.available_qty}
                        className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 w-16 text-center font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                        value={it.quantity}
                        onChange={e => updateItem(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="number" min="0" max="100"
                        className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 w-16 text-center focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                        value={it.discount_percent}
                        onChange={e => updateItem(i, { discount_percent: parseFloat(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-gray-900">
                      {fmt.currency(it.quantity * it.mrp * (1 - (it.discount_percent || 0) / 100))}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => removeItem(i)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 rounded transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer row */}
          {items.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center gap-5 text-xs text-gray-500 flex-shrink-0">
              <span className="font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
              <span>Total units: <strong className="text-gray-700">{items.reduce((a, it) => a + it.quantity, 0)}</strong></span>
            </div>
          )}
        </div>

        {/* RIGHT — payment panel */}
        <div className="w-72 flex-shrink-0 bg-white flex flex-col border-l border-gray-100">

          {/* Payment mode */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Payment Mode</p>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_MODES.map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMode(m)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    paymentMode === m
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-base leading-none">{PAYMENT_ICONS[m]}</span>
                  <span>{m}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="px-4 py-3 border-b border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Discount %</label>
            <input
              type="number" min="0" max="100"
              className="mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-center text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={discount}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Bill summary — shows accurate totals including GST */}
          <div className="px-4 py-4 flex-1 flex flex-col gap-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bill Summary</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal (excl. GST)</span>
                <span className="font-mono">{fmt.currency(subtotal)}</span>
              </div>
              {overallDiscAmt > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Discount ({discount}%)</span>
                  <span className="font-mono">− {fmt.currency(overallDiscAmt)}</span>
                </div>
              )}
              {hasGst && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>GST (CGST + SGST)</span>
                  <span className="font-mono">{fmt.currency(gstTotal)}</span>
                </div>
              )}
              {!hasGst && items.length > 0 && (
                <p className="text-[10px] text-gray-400">* GST not applicable (0% rated items)</p>
              )}
              <div className="flex justify-between items-center pt-2 mt-1 border-t-2 border-gray-900">
                <span className="font-bold text-gray-900 text-base">TOTAL</span>
                <span className="font-bold text-primary text-2xl font-mono">{fmt.currency(grandTotal)}</span>
              </div>
            </div>

            {/* Amount received */}
            <div className="mt-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount Received (₹)</label>
              <input
                type="number"
                className="mt-1.5 w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-center text-xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder={String(grandTotal)}
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
              />
            </div>

            {amountPaid !== '' && (
              <div className={`rounded-xl p-3 text-center ${balance > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {balance > 0 ? 'Balance Due' : 'Return Change'}
                </p>
                <p className={`text-2xl font-bold font-mono mt-0.5 ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {fmt.currency(Math.abs(balance))}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <button
              className="btn-primary w-full justify-center py-3 text-sm gap-2 shadow-sm"
              disabled={!items.length || mut.isPending}
              onClick={submit}
            >
              <Printer size={15} />
              {mut.isPending ? 'Creating Bill…' : 'Create Bill & Print'}
            </button>
            <button
              onClick={() => navigate('/sales')}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
